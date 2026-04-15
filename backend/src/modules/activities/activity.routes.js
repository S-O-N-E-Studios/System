
//  * Mounted at /:tenantSlug/projects/:projectId/activities
//  * CLIENT_TEMP can read activities (read-only project view per spec section 5.1).
//  * Image upload: PM, Admin, Member (section 7.3).
//  * Write/delete: PM, Admin only.
 

const express      = require('express');
const router       = express.Router({ mergeParams: true });
const ctrl         = require('./activity.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate     = require('../../middleware/validation.middleware');
const { requirePM, denyClientTemp } = require('../../middleware/rbac.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { ROLES }    = require('../../constants/roles');
const { createActivitySchema, updateActivitySchema } = require('./activity.validation');
const Joi          = require('joi');

const addImageSchema = Joi.object({
  fileId:  Joi.string().hex().length(24).required(),
  caption: Joi.string().trim().max(300).allow(null, ''),
});

// Read — all roles including CLIENT_TEMP (scope enforced at project level)
router.get('/',  asyncHandler(ctrl.list));

// Write — PM and above only
router.post('/',
  denyClientTemp,
  requirePM,
  validate(createActivitySchema),
  asyncHandler(ctrl.create)
);

router.patch('/:actId',
  denyClientTemp,
  requirePM,
  validate(updateActivitySchema),
  asyncHandler(ctrl.update)
);

router.delete('/:actId',
  denyClientTemp,
  requirePM,
  asyncHandler(ctrl.remove)
);

// Images — PM, Admin, Member can upload (spec section 7.3)
router.post('/:actId/images',
  denyClientTemp,
  requireRole([ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.DEPT_ADMIN, ROLES.PM, ROLES.MEMBER]),
  validate(addImageSchema),
  asyncHandler(ctrl.addImage)
);

router.delete('/:actId/images/:imageId',
  denyClientTemp,
  requirePM,
  asyncHandler(ctrl.removeImage)
);

module.exports = router;