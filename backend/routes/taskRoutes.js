// routes/taskRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask); // permissions handled in controller or by role middleware

router.route('/:taskId')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;