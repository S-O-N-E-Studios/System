const StageApproval = require('../stage-gate/stageApproval.model');
const { sendSuccess } = require('../../utils/apiResponse');

const getPendingSummary = async (req, res) => {
  const rows = await StageApproval.aggregate([
    {
      $match: {
        tenantId: req.tenant._id,
        approvalStatus: 'pending',
      },
    },
    {
      $group: {
        _id: '$projectId',
        pendingCount: { $sum: 1 },
        oldestPendingAt: { $min: '$createdAt' },
      },
    },
    {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: '_id',
        as: 'project',
      },
    },
    {
      $unwind: '$project',
    },
    {
      $project: {
        _id: 0,
        projectId: '$_id',
        projectName: '$project.name',
        projectRefCode: '$project.refCode',
        currentStage: '$project.currentStage',
        stageTopLevel: '$project.stageTopLevel',
        pendingCount: 1,
        oldestPendingAt: 1,
      },
    },
    {
      $sort: {
        pendingCount: -1,
        oldestPendingAt: 1,
      },
    },
  ]);

  return sendSuccess(res, { items: rows });
};

module.exports = {
  getPendingSummary,
};
