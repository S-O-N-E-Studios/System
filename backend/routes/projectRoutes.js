// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// All routes after this middleware are protected
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(authorize('admin', 'project_manager'), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(authorize('admin', 'project_manager'), updateProject)
  .delete(authorize('admin'), deleteProject);

module.exports = router;