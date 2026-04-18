
//  * Mounted at /:tenantSlug/departments
//  *
//  * GET    /           — list departments
//  * POST   /           — create (Org Admin)
//  * GET    /:deptId   — get one
//  * PATCH  /:deptId   — update (Dept Admin+; DEPT_ADMIN scoped via requireDeptScope)
//  * DELETE /:deptId   — delete (Org Admin)
 

const express      = require('express');
const router       = express.Router();
const ctrl         = require('./department.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate     = require('../../middleware/validation.middleware');
const { requireOrgAdmin, requireDeptAdmin, denyClientTemp, requireDeptScope } = require('../../middleware/rbac.middleware');
const { createDepartmentSchema, updateDepartmentSchema } = require('./department.validation');

router.use(denyClientTemp);

router.get('/', asyncHandler(ctrl.list));

router.post('/',
  requireOrgAdmin,
  validate(createDepartmentSchema),
  asyncHandler(ctrl.create)
);

router.get('/:deptId',
  requireDeptScope,
  asyncHandler(ctrl.getOne)
);

router.patch('/:deptId',
  requireDeptAdmin,
  requireDeptScope,
  validate(updateDepartmentSchema),
  asyncHandler(ctrl.update)
);

router.delete('/:deptId',
  requireOrgAdmin,
  asyncHandler(ctrl.remove)
);

module.exports = router;
