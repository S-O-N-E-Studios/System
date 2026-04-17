
//  * Abstracts S3 / Azure Blob behind a single interface.
//  * All file paths are tenant-namespaced: {tenantSlug}/{projectId}/{uuid}_{filename}
//  *
//  * Presigned URL expiry:
//  *  - Upload URLs:   15 minutes (browser must upload within this window)
//  *  - Download URLs: 15 minutes (spec section 7.5)


const { v4: uuidv4 } = require('uuid');
const env            = require('../config/env');

// Lazy-load SDK clients so the app starts without throwing
// if credentials aren't present (e.g. in test environment)
let s3Client;
const getS3 = () => {
  if (!s3Client) {
    const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    s3Client = { S3Client, PutObjectCommand, GetObjectCommand, getSignedUrl };
  }
  return s3Client;
};

//  Path builder ─

/**
 * Build a namespaced storage path.
 * Format: {tenantSlug}/{projectId}/{uuid}_{originalName}
 * Sanitises the filename to remove unsafe characters.
 */
const buildStoragePath = (tenantSlug, projectId, originalName) => {
  const safe = originalName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase()
    .slice(0, 100);
  return `${tenantSlug}/${projectId}/${uuidv4()}_${safe}`;
};

//  S3 

const getS3UploadPresignedUrl = async (storagePath, mimeType) => {
  const { S3Client, PutObjectCommand, getSignedUrl } = getS3();
  const client  = new S3Client({ region: env.AWS_REGION });
  const command = new PutObjectCommand({
    Bucket:      env.AWS_S3_BUCKET,
    Key:         storagePath,
    ContentType: mimeType,
  });
  return getSignedUrl(client, command, { expiresIn: 900 }); // 15 min
};

const getS3DownloadPresignedUrl = async (storagePath) => {
  const { S3Client, GetObjectCommand, getSignedUrl } = getS3();
  const client  = new S3Client({ region: env.AWS_REGION });
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key:    storagePath,
  });
  return getSignedUrl(client, command, { expiresIn: 900 }); // 15 min
};

//  Azure Blob 

const getAzureUploadPresignedUrl = async (_storagePath, _mimeType) => {
  // Stub — implement when STORAGE_PROVIDER=azure (Open Item #11)
  throw new Error('Azure Blob presigned URLs not yet implemented');
};

const getAzureDownloadPresignedUrl = async (_storagePath) => {
  throw new Error('Azure Blob presigned URLs not yet implemented');
};

//  Public interface 

/**
 * Get a presigned URL for direct browser-to-storage upload.
 */
const getUploadUrl = (storagePath, mimeType) => {
  if (env.isTest) return Promise.resolve(`https://mock-storage.test/${storagePath}`);
  if (!env.AWS_REGION || !env.AWS_S3_BUCKET) {
    return Promise.resolve(`placeholder://${storagePath}`);
  }
  if (env.STORAGE_PROVIDER === 'azure') return getAzureUploadPresignedUrl(storagePath, mimeType);
  return getS3UploadPresignedUrl(storagePath, mimeType).catch(() => `placeholder://${storagePath}`);
};

/**
 * Get a presigned URL for downloading a file (15-minute expiry).
 */
const getDownloadUrl = (storagePath) => {
  if (env.isTest) return Promise.resolve(`https://mock-storage.test/${storagePath}`);
  if (!env.AWS_REGION || !env.AWS_S3_BUCKET) {
    return Promise.resolve(`placeholder://${storagePath}`);
  }
  if (env.STORAGE_PROVIDER === 'azure') return getAzureDownloadPresignedUrl(storagePath);
  return getS3DownloadPresignedUrl(storagePath).catch(() => `placeholder://${storagePath}`);
};

module.exports = { buildStoragePath, getUploadUrl, getDownloadUrl };