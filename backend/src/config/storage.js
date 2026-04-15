const env = require('./env');

const getStorageConfig = () => ({
  provider: env.STORAGE_PROVIDER,
  aws: {
    region: env.AWS_REGION,
    bucket: env.AWS_S3_BUCKET,
  },
});

module.exports = { getStorageConfig };
