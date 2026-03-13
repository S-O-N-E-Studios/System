const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  category: {
    type: String,
    enum: ['report', 'spreadsheet', 'image', 'document'],
    default: 'document',
  },
  documentType: {
    type: String,
    enum: [
      'payment_certificate',
      'tender_document',
      'drawings',
      'digital_survey',
      'geo_technical_report',
      'environmental_report',
    ],
  },
  url: String,
  path: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

fileSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('File', fileSchema);
