const Payment = require('../models/Payment');

function formatPayment(p) {
  const obj = p.toObject ? p.toObject() : p;
  return {
    id: (obj._id || obj.id).toString(),
    tenantId: obj.tenantId ? obj.tenantId.toString() : null,
    projectId: obj.projectId ? obj.projectId.toString() : null,
    projectName: obj.projectName || null,
    consultantName: obj.consultantName,
    invoiceNumber: obj.invoiceNumber,
    paymentDate: obj.paymentDate ? (obj.paymentDate.toISOString ? obj.paymentDate.toISOString() : obj.paymentDate) : null,
    paymentAmount: obj.paymentAmount,
    paymentStatus: obj.paymentStatus,
    createdAt: obj.createdAt ? (obj.createdAt.toISOString ? obj.createdAt.toISOString() : obj.createdAt) : null,
  };
}

// GET /api/payments/history
exports.getPaymentHistory = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;
    const { page = 1, pageSize = 20, status, projectId, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const filter = {};
    if (tenantId) filter.tenantId = tenantId;
    if (status) filter.paymentStatus = status;
    if (projectId) filter.projectId = projectId;
    if (dateFrom || dateTo) {
      filter.paymentDate = {};
      if (dateFrom) filter.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) filter.paymentDate.$lte = new Date(dateTo);
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ paymentDate: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(filter),
    ]);

    res.json({
      data: payments.map(formatPayment),
      total,
      page: parseInt(page),
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/payments/forecast
exports.getPaymentForecast = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;
    const filter = {};
    if (tenantId) filter.tenantId = tenantId;

    const now = new Date();
    const months = [];
    for (let i = -3; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      });
    }

    const payments = await Payment.find({
      ...filter,
      paymentDate: { $gte: months[0].start, $lte: months[months.length - 1].end },
    }).lean();

    const actual = [];
    const forecast = [];

    months.forEach((m) => {
      const monthPayments = payments.filter(
        (p) => new Date(p.paymentDate) >= m.start && new Date(p.paymentDate) <= m.end
      );
      const totalAmount = monthPayments.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

      if (m.start <= now) {
        actual.push({ month: m.month, amount: totalAmount });
      }

      // Forecast: use actual data for past months, project forward for future
      if (m.start > now) {
        const avgMonthly = actual.length > 0
          ? actual.reduce((s, a) => s + a.amount, 0) / actual.length
          : 0;
        forecast.push({ month: m.month, amount: Math.round(avgMonthly * (0.9 + Math.random() * 0.2)) });
      } else {
        forecast.push({ month: m.month, amount: totalAmount });
      }
    });

    res.json({ data: { forecast, actual } });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
