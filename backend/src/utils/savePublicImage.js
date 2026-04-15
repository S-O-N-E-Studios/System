const path = require('path');
const fs = require('fs/promises');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');

const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/**
 * Write an image buffer under uploads/{tenantSlug}/{subDir}/… and return the web path /uploads/…
 */
async function saveTenantImage({ tenantSlug, subDir, baseName, mimeType, buffer }) {
  const ext = MIME_EXT[mimeType];
  if (!ext) {
    const err = new Error('Unsupported image type. Use JPEG, PNG, WebP, or GIF.');
    err.status = 400;
    throw err;
  }

  const diskPath = path.join(UPLOAD_ROOT, tenantSlug, subDir, `${baseName}${ext}`);

  await fs.mkdir(path.dirname(diskPath), { recursive: true });
  await fs.writeFile(diskPath, buffer);

  const relative = [tenantSlug, subDir, `${baseName}${ext}`].join('/');
  return `/uploads/${relative}`;
}

/**
 * Return a path-only URL so browsers on the SPA origin resolve `/uploads/...` same-site
 * (e.g. Vite proxy) and avoid cross-origin CORP issues. Use CLIENT_URL + webPath for absolute links in emails.
 */
function publicUrlFromReq(_req, webPath) {
  return webPath;
}

module.exports = {
  UPLOAD_ROOT,
  saveTenantImage,
  publicUrlFromReq,
};
