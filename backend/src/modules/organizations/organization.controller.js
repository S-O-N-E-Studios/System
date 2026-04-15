const multer = require('multer');
const orgService = require('./organization.services');
const { sendSuccess } = require('../../utils/apiResponse');
const { ROLES } = require('../../constants/roles');
const { saveTenantImage, publicUrlFromReq } = require('../../utils/savePublicImage');

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
    cb(null, true);
  },
});

const get = async (req, res) => {
  const org = await orgService.getOrganization(req.tenant);
  const isOrgAdmin = req.tenantMembership?.role === ROLES.ORG_ADMIN;
  if (!isOrgAdmin) {
    const { outboundEmail: _outboundEmail, ...safe } = org;
    return sendSuccess(res, { organization: safe });
  }
  return sendSuccess(res, { organization: org });
};

const update = async (req, res) => {
  const org = await orgService.updateOrganization(req.tenant, req.body);
  return sendSuccess(res, { organization: org });
};

const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded (use field name "file")' });
  }
  const webPath = await saveTenantImage({
    tenantSlug: req.tenant.slug,
    subDir:     'logos',
    baseName:   `logo-${Date.now()}`,
    mimeType:   req.file.mimetype,
    buffer:     req.file.buffer,
  });
  const logoUrl = publicUrlFromReq(req, webPath);
  const org = await orgService.updateOrganization(req.tenant, { logoUrl });
  return sendSuccess(res, { organization: org, logoUrl });
};

module.exports = { get, update, uploadLogo, logoUpload };
