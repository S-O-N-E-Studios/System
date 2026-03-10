// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadFile, getFile, downloadFile } = require('../controllers/uploadController');

// All routes protected
router.use(protect);

// POST /api/upload - single file upload
router.post('/', upload.single('file'), uploadFile);

// GET /api/upload/:id - get file metadata
router.get('/:id', getFile);

// GET /api/upload/:id/download - download file
router.get('/:id/download', downloadFile);

module.exports = router;