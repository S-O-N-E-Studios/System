// Minimal auth controller so that frontend login & organisation registration
// flows work end‑to‑end during early development.

function buildTokens() {
  const base = Date.now().toString(36);
  return {
    accessToken: `demo-access-${base}`,
    refreshToken: `demo-refresh-${base}`,
  };
}

function buildUserFromRegister(body) {
  const {
    orgName,
    slug,
    adminFirstName,
    adminLastName,
    adminEmail,
  } = body;

  const tenantId = `tenant-${Date.now().toString(36)}`;

  return {
    id: `user-${Date.now().toString(36)}`,
    email: adminEmail,
    firstName: adminFirstName,
    lastName: adminLastName,
    role: 'ORG_ADMIN',
    tenants: [
      {
        id: tenantId,
        slug,
        name: orgName,
        logo: undefined,
        role: 'ORG_ADMIN',
      },
    ],
  };
}

function buildDemoUser(email) {
  return {
    id: 'demo-user',
    email,
    firstName: 'Demo',
    lastName: 'User',
    role: 'ORG_ADMIN',
    tenants: [
      {
        id: 'tenant-1',
        slug: 'limpopo-civil',
        name: 'Limpopo Civil Engineering',
        logo: undefined,
        role: 'ORG_ADMIN',
      },
      {
        id: 'tenant-2',
        slug: 'gauteng-structures',
        name: 'Gauteng Structures Corp',
        logo: undefined,
        role: 'PROJECT_MANAGER',
      },
    ],
  };
}

exports.login = (req, res) => {
  const { email } = req.body;
  const user = buildDemoUser(email || 'demo@project360.com');
  const tokens = buildTokens();

  res.json({
    data: {
      user,
      tokens,
    },
  });
};

exports.registerOrg = (req, res) => {
  const body = req.body || {};
  const required = ['orgName', 'slug', 'adminFirstName', 'adminLastName', 'adminEmail', 'adminPassword'];
  const missing = required.filter((key) => !body[key]);
  if (missing.length > 0) {
    return res.status(400).json({
      data: null,
      message: `Missing required fields: ${missing.join(', ')}`,
    });
  }

  const user = buildUserFromRegister(body);
  const tokens = buildTokens();

  res.status(201).json({
    data: {
      user,
      tokens,
    },
    message: 'Organisation registered (demo)',
  });
};

exports.checkSlug = (req, res) => {
  const { slug } = req.params;
  // Very lightweight check: mark obviously "taken" slugs as unavailable.
  const taken = ['demo', 'test', 'project360', 'project-360'];

  const available = !taken.includes(String(slug).toLowerCase());

  res.json({
    data: {
      available,
      suggestion: available ? undefined : `${slug}-1`,
    },
  });
};

exports.acceptInvite = (req, res) => {
  const { token, password } = req.body || {};
  const email = token ? `invite+${token}@example.com` : 'invite@example.com';
  void password; // unused in demo implementation

  const user = buildDemoUser(email);
  const tokens = buildTokens();

  res.json({
    data: {
      user,
      tokens,
    },
    message: 'Invite accepted (demo)',
  });
};

exports.changePassword = (req, res) => {
  void req.body; // no‑op in demo
  res.json({
    data: null,
    message: 'Password changed (demo)',
  });
};

exports.refreshToken = (req, res) => {
  void req.body; // no‑op in demo
  const tokens = buildTokens();
  res.json({
    data: tokens,
  });
};

exports.getMe = (req, res) => {
  // In a real implementation we would read the user from the access token.
  // For now, return a stable demo user so the UI can hydrate.
  const user = buildDemoUser('demo@project360.com');
  res.json({
    data: user,
  });
};
