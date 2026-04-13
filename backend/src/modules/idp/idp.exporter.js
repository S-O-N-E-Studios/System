/**
 * Flatten grouped IDP payload and render as CSV (UTF-8).
 */

const escapeCell = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const flattenGrouped = (grouped) => {
  const rows = [];
  for (const group of grouped || []) {
    const municipality = group.localMunicipality ?? '';
    for (const p of group.projects || []) {
      rows.push({
        localMunicipality: municipality,
        idpProjectNo: p.idpProjectNo,
        refCode: p.refCode,
        name: p.name,
        status: p.status,
        currentStage: p.currentStage,
        serviceCategory: p.serviceCategory,
        projectManagerName: p.projectManagerName,
        contractValueAdjusted: p.contractValueAdjusted,
        expenditureToDate: p.expenditureToDate,
      });
    }
  }
  return rows;
};

const toCsv = (rows) => {
  const headers = [
    'localMunicipality',
    'idpProjectNo',
    'refCode',
    'name',
    'status',
    'currentStage',
    'serviceCategory',
    'projectManagerName',
    'contractValueAdjusted',
    'expenditureToDate',
  ];

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','));
  }
  return lines.join('\r\n');
};

const buildIdpCsv = (grouped) => {
  const flat = flattenGrouped(grouped);
  return toCsv(flat);
};

module.exports = {
  flattenGrouped,
  buildIdpCsv,
};
