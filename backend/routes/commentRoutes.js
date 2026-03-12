// routes/commentRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // to get taskId from URL
const { protect } = require('../middleware/authMiddleware');
const {
  getComments,
  addComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');

router.use(protect);

router.route('/')
  .get(getComments)
  .post(addComment);

router.route('/:commentId')
  .put(updateComment)
  .delete(deleteComment);

module.exports = router;