const express = require('express');
const router = express.Router();
const { protect, authorize, requireTenant } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getFiles,
  uploadFile,
  deleteFile,
  downloadFile,
} = require('../controllers/fileController');

router.use(protect);
router.use(requireTenant);

router.get('/', getFiles);
router.post('/upload', upload.single('file'), uploadFile);
router.delete('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), deleteFile);
router.get('/:id/download', downloadFile);

module.exports = router;
