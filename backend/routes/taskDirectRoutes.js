// routes/taskDirectRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

router.use(protect);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;