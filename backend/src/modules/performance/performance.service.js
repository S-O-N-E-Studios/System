const PerformanceSnapshot = require('./performanceSnapshot.model');
const Project = require('../projects/project.model');
const { PaymentForecast } = require('../payments/payment.model');

const clampPct = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, num));
};

const toRag = ({
  progressProjectedPct,
  progressActualPct,
  expenditureProjectedPct,
  expenditureActualPct,
}) => {
  const progressGap = clampPct(progressProjectedPct) - clampPct(progressActualPct);
  const expenditureOverrun = clampPct(expenditureActualPct) - clampPct(expenditureProjectedPct);
  if (progressGap > 15 || expenditureOverrun > 20) return 'red';
  if (progressGap >= 5 || expenditureOverrun >= 10) return 'amber';
  return 'green';
};

const toPercent = (numerator, denominator) => {
  const num = Number(numerator);
  const den = Number(denominator);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 0;
  return clampPct((num / den) * 100);
};

const parsePeriodMonth = (period) => {
  const value = String(period || '');
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  return Number(value.replace('-', ''));
};

const getDate = (value) => {
  const dt = value ? new Date(value) : null;
  return dt && !Number.isNaN(dt.getTime()) ? dt : null;
};

const computeTimeElapsedPct = (startDate, endDate, now = new Date()) => {
  const start = getDate(startDate);
  const end = getDate(endDate);
  if (!start || !end || end <= start) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;
  return clampPct(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);
};

const buildMetricsWithRag = (source = {}) => {
  const consultant = {
    progressProjectedPct: clampPct(source?.consultant?.progressProjectedPct),
    progressActualPct: clampPct(source?.consultant?.progressActualPct),
    expenditureProjectedPct: clampPct(source?.consultant?.expenditureProjectedPct),
    expenditureActualPct: clampPct(source?.consultant?.expenditureActualPct),
  };
  const construction = {
    progressProjectedPct: clampPct(source?.construction?.progressProjectedPct),
    progressActualPct: clampPct(source?.construction?.progressActualPct),
    expenditureProjectedPct: clampPct(source?.construction?.expenditureProjectedPct),
    expenditureActualPct: clampPct(source?.construction?.expenditureActualPct),
    timeProjectedPct: clampPct(source?.construction?.timeProjectedPct),
    timeActualPct: clampPct(source?.construction?.timeActualPct),
  };
  return {
    consultant: {
      ...consultant,
      rag: toRag(consultant),
    },
    construction: {
      ...construction,
      rag: toRag(construction),
    },
  };
};

const list = (tenantId, projectId) =>
  PerformanceSnapshot.find({ tenantId, projectId }).sort({ period: -1 }).lean();

const deriveLiveMetrics = async (tenantId, projectId, latestSnapshot = null) => {
  const [project, forecasts] = await Promise.all([
    Project.findOne({ tenantId, _id: projectId }).lean(),
    PaymentForecast.find({ tenantId, projectId }).lean(),
  ]);
  if (!project) return null;

  const currentPeriod = parsePeriodMonth(new Date().toISOString().slice(0, 7));
  const cumulativeForecast = forecasts
    .filter((row) => {
      const month = parsePeriodMonth(row.month);
      return month != null && currentPeriod != null && month <= currentPeriod;
    })
    .reduce((sum, row) => sum + Number(row.forecastAmount || 0), 0);

  const adjustedValue = Number(project.contractValueAdjusted || project.contractValueOriginal || 0);
  const expenditureActualPct = toPercent(project.expenditureToDate || 0, adjustedValue);
  const expenditureProjectedPct = toPercent(cumulativeForecast, adjustedValue);

  const baseline = buildMetricsWithRag({
    consultant: {
      progressProjectedPct: latestSnapshot?.consultant?.progressProjectedPct || 0,
      progressActualPct: latestSnapshot?.consultant?.progressActualPct || 0,
      expenditureProjectedPct,
      expenditureActualPct,
    },
    construction: {
      progressProjectedPct: latestSnapshot?.construction?.progressProjectedPct || 0,
      progressActualPct: latestSnapshot?.construction?.progressActualPct || 0,
      expenditureProjectedPct,
      expenditureActualPct,
      timeProjectedPct: computeTimeElapsedPct(
        project.startDate || project.createdAt,
        project.completionDateOriginal || project.completionDate || project.completionDateAdjusted
      ),
      timeActualPct: computeTimeElapsedPct(
        project.startDate || project.createdAt,
        project.completionDateAdjusted || project.completionDate || project.completionDateOriginal
      ),
    },
  });

  return {
    period: new Date().toISOString().slice(0, 7),
    ...baseline,
  };
};

const upsert = async (tenantId, projectId, userId, payload) => {
  const metrics = buildMetricsWithRag(payload);
  const doc = await PerformanceSnapshot.findOneAndUpdate(
    { tenantId, projectId, period: payload.period },
    {
      $set: {
        consultant: metrics.consultant,
        construction: metrics.construction,
        capturedBy: userId,
        capturedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
};

module.exports = {
  list,
  upsert,
  deriveLiveMetrics,
};
