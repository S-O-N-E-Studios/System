const express = require('express');
const router = express.Router();
const { protect, authorize, requireTenant } = require('../middleware/authMiddleware');
const {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
} = require('../controllers/taskController');

router.use(protect);
router.use(requireTenant);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comments', addComment);

router.route('/:id')
  .patch(updateTask)
  .delete(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), deleteTask);

module.exports = router;
