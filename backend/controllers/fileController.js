const File = require('../models/File');

function getTenantId(req) {
  return req.tenant ? req.tenant._id : null;
}

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

exports.getFiles = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const { projectId, category, documentType, page = 1, pageSize = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const filter = { tenantId };
    if (projectId) filter.projectId = projectId;
    if (category) filter.category = category;
    if (documentType) filter.documentType = documentType;

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

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

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

exports.deleteFile = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const file = await File.findOne({ _id: req.params.id, tenantId });
    if (!file) return res.status(404).json({ message: 'File not found' });

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

exports.downloadFile = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const file = await File.findOne({ _id: req.params.id, tenantId });
    if (!file) return res.status(404).json({ message: 'File not found' });

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
