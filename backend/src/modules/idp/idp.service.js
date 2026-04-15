const mongoose = require('mongoose');
const Project = require('../projects/project.model');

const buildMatch = (tenantId, filters = {}) => {
  const match = {
    tenantId: new mongoose.Types.ObjectId(tenantId),
    deletedAt: null,
    idpProjectNo: { $nin: [null, ''] },
  };

  if (filters.localMunicipality) {
    match.localMunicipality = filters.localMunicipality;
  }
  if (filters.serviceCategory) {
    match.serviceCategory = filters.serviceCategory;
  }
  if (filters.stage !== undefined && filters.stage !== '') {
    match.currentStage = parseInt(filters.stage, 10);
  }
  if (filters.status) {
    match.status = filters.status;
  }

  return match;
};

/**
 * Projects with an IDP number, grouped by localMunicipality.
 */
const getIdpData = async (tenant, filters = {}) => {
  const match = buildMatch(tenant._id, filters);

  const grouped = await Project.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'projectManager',
        foreignField: '_id',
        as: 'pm',
      },
    },
    {
      $addFields: {
        projectManagerName: { $arrayElemAt: ['$pm.fullName', 0] },
      },
    },
    {
      $project: {
        pm: 0,
        stageHistory: 0,
        contractValueHistory: 0,
      },
    },
    { $sort: { localMunicipality: 1, idpProjectNo: 1 } },
    {
      $group: {
        _id: '$localMunicipality',
        projects: { $push: '$$ROOT' },
        projectCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return grouped.map((g) => ({
    localMunicipality: g._id,
    projectCount: g.projectCount,
    projects: g.projects,
  }));
};

module.exports = { getIdpData };
