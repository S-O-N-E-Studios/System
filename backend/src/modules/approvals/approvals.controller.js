const StageApproval = require('../stage-gate/stageApproval.model');
const ExtensionOfTime = require('../extension-of-time/extensionOfTime.model');
const Penalty = require('../penalties/penalty.model');
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

  const [eotRows, penaltyRows] = await Promise.all([
    ExtensionOfTime.aggregate([
      {
        $match: {
          tenantId: req.tenant._id,
          status: 'pending_approval',
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      { $unwind: '$project' },
      {
        $project: {
          _id: 0,
          eotId: '$_id',
          projectId: '$projectId',
          projectName: '$project.name',
          projectRefCode: '$project.refCode',
          requestedDays: '$requestedDays',
          reason: '$reason',
          createdAt: '$createdAt',
        },
      },
      { $sort: { createdAt: 1 } },
    ]),
    Penalty.aggregate([
      {
        $match: {
          tenantId: req.tenant._id,
          status: 'pending_approval',
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      { $unwind: '$project' },
      {
        $project: {
          _id: 0,
          penaltyId: '$_id',
          projectId: '$projectId',
          projectName: '$project.name',
          projectRefCode: '$project.refCode',
          penaltyType: '$penaltyType',
          amountCents: '$amountCents',
          reason: '$reason',
          createdAt: '$createdAt',
        },
      },
      { $sort: { createdAt: 1 } },
    ]),
  ]);

  return sendSuccess(res, {
    items: rows,
    stageApprovals: rows,
    extensionOfTime: eotRows,
    penalties: penaltyRows,
    totals: {
      stageApprovals: rows.reduce((sum, item) => sum + Number(item.pendingCount || 0), 0),
      extensionOfTime: eotRows.length,
      penalties: penaltyRows.length,
    },
  });
};

module.exports = {
  getPendingSummary,
};
