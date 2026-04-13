
const deptService = require('./department.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const departments = await deptService.listDepartments(req.tenant);
  return sendSuccess(res, { departments });
};

const getOne = async (req, res) => {
  const dept = await deptService.getDepartment(req.tenant, req.params.deptId);
  return sendSuccess(res, { department: dept });
};

const create = async (req, res) => {
  const dept = await deptService.createDepartment(req.tenant, req.body);
  return sendCreated(res, { department: dept });
};

const update = async (req, res) => {
  const dept = await deptService.updateDepartment(req.tenant, req.params.deptId, req.body);
  return sendSuccess(res, { department: dept });
};

const remove = async (req, res) => {
  const result = await deptService.deleteDepartment(req.tenant, req.params.deptId);
  return sendSuccess(res, result);
};

module.exports = { list, getOne, create, update, remove };