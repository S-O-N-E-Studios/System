const fileService = require('./file.services');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const { ROLES } = require('../../constants/roles');

const list = async (req, res) => {
  const isClientTemp = req.user.role === ROLES.CLIENT_TEMP;
  const result = await fileService.listFiles(req.tenant, req.query, isClientTemp);
  return sendSuccess(res, result);
};

const requestUploadUrl = async (req, res) => {
  const { storagePath } = req.body;
  return sendSuccess(res, { url: 'placeholder', key: storagePath });
};

const register = async (req, res) => {
  const file = await fileService.registerFile(req.tenant, req.body, req.user.sub);
  return sendCreated(res, { file });
};

const toggleVisibility = async (req, res) => {
  const file = await fileService.toggleVisibility(req.tenant, req.params.id, req.user.sub);
  return sendSuccess(res, { file });
};

const remove = async (req, res) => {
  const result = await fileService.deleteFile(req.tenant, req.params.id);
  return sendSuccess(res, result);
};

const downloadUrl = async (req, res) => {
  const isClientTemp = req.user.role === ROLES.CLIENT_TEMP;
  const data = await fileService.getDownloadUrl(
    req.tenant,
    req.params.id,
    isClientTemp,
    req.clientAccess
  );
  return sendSuccess(res, data);
};

module.exports = {
  list,
  requestUploadUrl,
  register,
  toggleVisibility,
  remove,
  downloadUrl,
};
