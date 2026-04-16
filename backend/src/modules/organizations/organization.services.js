const Tenant = require('../tenants/tenant.model');
const { encryptTenantSmtpPassword } = require('../../utils/tenantSmtpCrypto');

const stripOutboundSecretsFromDoc = (doc) => {
  if (!doc?.outboundEmail?.authPassEncrypted) return doc;
  doc.outboundEmail = {
    ...doc.outboundEmail,
    authPassSet: true,
  };
  delete doc.outboundEmail.authPassEncrypted;
  return doc;
};

const getOrganization = async (tenant) => {
  const doc = await Tenant.findById(tenant._id).lean();
  if (!doc) throw Object.assign(new Error('Organisation not found'), { status: 404 });
  return stripOutboundSecretsFromDoc(doc);
};

const mergeOutboundEmail = (prev, incoming) => {
  const p = prev && typeof prev === 'object' ? { ...prev } : {};
  const inc = incoming && typeof incoming === 'object' ? incoming : {};

  const next = {
    enabled: inc.enabled !== undefined ? Boolean(inc.enabled) : Boolean(p.enabled),
    host: inc.host !== undefined ? (inc.host != null ? String(inc.host).trim() : '') || null : p.host ?? null,
    port: inc.port !== undefined ? Math.min(65535, Math.max(1, Number(inc.port) || 587)) : p.port ?? 587,
    secure: inc.secure !== undefined ? Boolean(inc.secure) : Boolean(p.secure),
    authUser:
      inc.authUser !== undefined
        ? (inc.authUser != null ? String(inc.authUser).trim() : '') || null
        : p.authUser ?? null,
    fromName:
      inc.fromName !== undefined
        ? (inc.fromName != null ? String(inc.fromName).trim() : '') || null
        : p.fromName ?? null,
    fromAddress:
      inc.fromAddress !== undefined
        ? (inc.fromAddress != null ? String(inc.fromAddress).trim().toLowerCase() : '') || null
        : p.fromAddress ?? null,
    replyTo:
      inc.replyTo !== undefined
        ? (inc.replyTo != null ? String(inc.replyTo).trim().toLowerCase() : '') || null
        : p.replyTo ?? null,
    authPassEncrypted: p.authPassEncrypted ?? null,
  };

  if (Object.prototype.hasOwnProperty.call(inc, 'authPass')) {
    if (inc.authPass === null || inc.authPass === '') {
      next.authPassEncrypted = null;
    } else {
      next.authPassEncrypted = encryptTenantSmtpPassword(String(inc.authPass));
    }
  }

  return next;
};

const updateOrganization = async (tenant, updates) => {
  const allowedTop = ['name', 'primaryContact', 'address', 'timezone', 'logoUrl', 'localMunicipalities', 'theme'];
  const sanitized = {};

  for (const k of allowedTop) {
    if (updates[k] !== undefined) sanitized[k] = updates[k];
  }

  if (updates.outboundEmail !== undefined) {
    const current = await Tenant.findById(tenant._id);
    if (!current) throw Object.assign(new Error('Organisation not found'), { status: 404 });
    const raw = current.outboundEmail;
    const prev =
      raw && typeof raw.toObject === 'function'
        ? raw.toObject()
        : { ...(raw || {}) };
    const next = mergeOutboundEmail(prev, updates.outboundEmail);
    if (next.enabled) {
      if (!next.host || !next.fromAddress) {
        throw Object.assign(
          new Error('Organisation email delivery requires SMTP host and From address when enabled'),
          { status: 400 }
        );
      }
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(String(next.fromAddress))) {
        throw Object.assign(new Error('From address must be a valid email'), { status: 400 });
      }
      if (next.replyTo && !emailRe.test(String(next.replyTo))) {
        throw Object.assign(new Error('Reply-To must be a valid email when set'), { status: 400 });
      }
    }
    sanitized.outboundEmail = next;
  }

  const updated = await Tenant.findByIdAndUpdate(tenant._id, sanitized, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) throw Object.assign(new Error('Organisation not found'), { status: 404 });
  return stripOutboundSecretsFromDoc(updated);
};

module.exports = {
  getOrganization,
  updateOrganization,
};
