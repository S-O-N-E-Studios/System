

const Activity = require('./activity.model');

const findByProject = (tenantId, projectId) =>
  Activity.find({ tenantId, projectId }).sort({ startDate: 1 });

const findById = (id, tenantId, projectId) =>
  Activity.findOne({ _id: id, tenantId, projectId });

const create = (data) => Activity.create(data);

const updateById = (id, tenantId, projectId, updates) =>
  Activity.findOneAndUpdate(
    { _id: id, tenantId, projectId },
    updates,
    { new: true, runValidators: true }
  );

const deleteById = (id, tenantId, projectId) =>
  Activity.findOneAndDelete({ _id: id, tenantId, projectId });

// Push a supporting image onto the activity's images array
const addImage = (id, tenantId, projectId, imageEntry) =>
  Activity.findOneAndUpdate(
    { _id: id, tenantId, projectId },
    { $push: { supportingImages: imageEntry } },
    { new: true }
  );

// Pull a supporting image by its _id
const removeImage = (id, tenantId, projectId, imageId) =>
  Activity.findOneAndUpdate(
    { _id: id, tenantId, projectId },
    { $pull: { supportingImages: { _id: imageId } } },
    { new: true }
  );

// Find all complete activities that have no supporting images (for Stage 5 gate check)
const findCompleteWithoutImages = (tenantId, projectId) =>
  Activity.find({
    tenantId,
    projectId,
    status: 'complete',
    'supportingImages.0': { $exists: false },
  });

module.exports = {
  findByProject,
  findById,
  create,
  updateById,
  deleteById,
  addImage,
  removeImage,
  findCompleteWithoutImages,
};