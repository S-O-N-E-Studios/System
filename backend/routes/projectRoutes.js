const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  exportXlsx,
  exportPdf,
  getActivities,
} = require('../controllers/projectController');

router.use(protect);

router.get('/export/xlsx', exportXlsx);
router.get('/export/pdf', exportPdf);

router.route('/')
  .get(getProjects)
  .post(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), createProject);

router.get('/:projectId/activities', getActivities);

router.route('/:id')
  .get(getProjectById)
  .patch(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), updateProject)
  .delete(authorize('SUPER_ADMIN', 'ORG_ADMIN'), deleteProject);

module.exports = router;
