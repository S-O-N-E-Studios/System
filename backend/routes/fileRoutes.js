const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getFiles,
  uploadFile,
  deleteFile,
  downloadFile,
} = require('../controllers/fileController');

router.use(protect);

router.get('/', getFiles);
router.post('/upload', upload.single('file'), uploadFile);
router.delete('/:id', deleteFile);
router.get('/:id/download', downloadFile);

module.exports = router;
