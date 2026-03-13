const File = require('../models/File');
const path = require('path');

function formatFile(f) {
  const obj = f.toObject ? f.toObject() : f;
  const uploader = obj.uploadedBy && typeof obj.uploadedBy === 'object' ? obj.uploadedBy : null;
  return {
    id: (obj._id || obj.id).toString(),
    tenantId: obj.tenantId ? obj.tenantId.toString() : null,
    projectId: obj.projectId ? obj.projectId.toString() : null,
    filename: obj.filename,
    originalName: obj.originalName,
    mimeType: obj.mimeType,
    size: obj.size,
    category: obj.category || 'document',
    documentType: obj.documentType || null,
    url: obj.url || (obj.path ? `/uploads/${obj.filename}` : null),
    uploadedById: uploader ? uploader._id.toString() : (obj.uploadedBy ? obj.uploadedBy.toString() : null),
    uploadedByName: uploader ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() : '',
    createdAt: obj.createdAt ? (obj.createdAt.toISOString ? obj.createdAt.toISOString() : obj.createdAt) : null,
  };
}

function inferCategory(mimeType) {
  if (!mimeType) return 'document';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.includes('pdf') || mimeType.includes('report')) return 'report';
  return 'document';
}

// GET /api/files
exports.getFiles = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;
    const { projectId, category, page = 1, pageSize = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const filter = {};
    if (tenantId) filter.tenantId = tenantId;
    if (projectId) filter.projectId = projectId;
    if (category) filter.category = category;

    const [files, total] = await Promise.all([
      File.find(filter)
        .populate('uploadedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      File.countDocuments(filter),
    ]);

    res.json({
      data: files.map(formatFile),
      total,
      page: parseInt(page),
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/files/upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const tenantId = req.tenant ? req.tenant._id : null;
    const { projectId, documentType } = req.body;

    const file = await File.create({
      tenantId,
      projectId: projectId || null,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      category: inferCategory(req.file.mimetype),
      documentType: documentType || null,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
    });

    const populated = await File.findById(file._id)
      .populate('uploadedBy', 'firstName lastName');

    res.status(201).json({ data: formatFile(populated) });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/files/:id
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fs = require('fs');
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await File.findByIdAndDelete(req.params.id);
    res.json({ data: null, message: 'File removed' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/files/:id/download
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.path) {
      const fs = require('fs');
      if (fs.existsSync(file.path)) {
        return res.download(file.path, file.originalName);
      }
    }

    const url = file.url || `/uploads/${file.filename}`;
    res.json({ data: { url } });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
