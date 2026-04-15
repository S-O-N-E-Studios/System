const idpService = require('./idp.service');
const { buildIdpCsv } = require('./idp.exporter');
const { sendSuccess } = require('../../utils/apiResponse');

const pickFilters = (query) => ({
  localMunicipality: query.localMunicipality,
  serviceCategory: query.serviceCategory,
  stage: query.stage,
  status: query.status,
});

const getIdp = async (req, res) => {
  const data = await idpService.getIdpData(req.tenant, pickFilters(req.query));
  return sendSuccess(res, { groupedByMunicipality: data });
};

const exportIdp = async (req, res) => {
  const data = await idpService.getIdpData(req.tenant, pickFilters(req.query));
  const csv = buildIdpCsv(data);
  const filename = `idp-export-${req.tenant.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
};

module.exports = { getIdp, exportIdp };
