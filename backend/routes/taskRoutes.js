const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.patch('/:id/status', updateTaskStatus);

router.route('/:id')
  .patch(updateTask)
  .delete(deleteTask);

module.exports = router;
