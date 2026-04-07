import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import { formatRands } from '@/utils/formatters';
import { Download, DollarSign, TrendingDown, Wallet, FileText, History, TrendingUp } from 'lucide-react';
import PaymentHistory from './PaymentHistory';
import PaymentForecast from './PaymentForecast';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { fetchReportsOverview } from '@/api/reports';
import { mockPaymentHistory } from '@/api/payments';
import { useUiStore } from '@/store/uiStore';
import jsPDF from 'jspdf';
import { MOCK_PORTFOLIO_PROJECTS } from '@/mocks/portfolioProjects';
import { SERVICE_CATEGORY_LABELS } from '@/types';

type ReportsTab = 'overview' | 'payment-history' | 'payment-forecast';

export default function Reports() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [activeTab, setActiveTab] = useState<ReportsTab>('overview');
  const { addToast } = useUiStore();

  const {
    data: overview,
    isLoading,
    isError: overviewError,
  } = useQuery({
    queryKey: ['reports', 'overview', tenantSlug],
    queryFn: fetchReportsOverview,
  });

  const [preview, setPreview] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview?.url]);

  const generateReportPdfBlob = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const marginX = 40;
    let y = 50;

    doc.setFontSize(16);
    doc.text('Reports Export', marginX, y);
    y += 22;

    doc.setFontSize(10);

    const drawLine = (label: string, value: string) => {
      const line = `${label}: ${value}`;
      const chunks = doc.splitTextToSize(line, 520);
      for (const c of chunks) {
        doc.text(c, marginX, y);
        y += 12;
      }
    };

    if (activeTab === 'overview') {
      if (!overview) return null;
      drawLine('Allocated', formatRands(overview.kpis.allocated));
      drawLine('Spent', formatRands(overview.kpis.spent));
      drawLine('Remaining', formatRands(overview.kpis.remaining));

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Departments', marginX, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      for (const dept of overview.departments) {
        drawLine(dept.deptName, formatRands(dept.totalBudget));
      }

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Service Categories', marginX, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      for (const sc of overview.serviceCategories) {
        drawLine(sc.category, formatRands(sc.totalValue));
      }
    } else if (activeTab === 'payment-history') {
      doc.setFont('helvetica', 'bold');
      doc.text('Payment History', marginX, y);
      y += 14;
      doc.setFont('helvetica', 'normal');

      const entries = mockPaymentHistory();
      for (const e of entries) {
        drawLine(`${e.projectName} · ${e.invoiceNumber}`, `${e.paymentDate} · ${formatRands(e.paymentAmount)} · ${e.paymentStatus}`);
      }
    } else {
      // payment-forecast
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Forecast', marginX, y);
      y += 14;
      doc.setFont('helvetica', 'normal');

      const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const expectedPerMonth = 6_200_000;
      for (let i = 0; i < MONTHS.length; i++) {
        const month = MONTHS[i];
        const variance = 0.82 + (i % 5) * 0.04;
        const actual = Math.round(expectedPerMonth * variance);
        drawLine(month, `Expected ${formatRands(expectedPerMonth)} · Actual ${formatRands(actual)}`);
      }
    }

    return doc.output('blob');
  };

  const handlePreviewReport = () => {
    const blob = generateReportPdfBlob();
    if (!blob) {
      addToast({ type: 'error', message: 'Unable to generate report preview.' });
      return;
    }

    const url = URL.createObjectURL(blob);
    const filename = `Reports-${activeTab}.${'pdf'}`;
    setPreview({ url, filename });
  };

  const handleDownloadPreview = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview.url;
    a.download = preview.filename;
    a.click();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Reports</h1>
        <Button variant="primary" onClick={handlePreviewReport}>
          <Download className="h-3.5 w-3.5" />
          Export Report
        </Button>
      </div>

      {/* Tab row */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={[
            'text-button inline-flex items-center gap-2 px-6 py-3 transition-all duration-300',
            activeTab === 'overview'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          <FileText className="h-3.5 w-3.5" />
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payment-history')}
          className={[
            'text-button inline-flex items-center gap-2 px-6 py-3 transition-all duration-300',
            activeTab === 'payment-history'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          <History className="h-3.5 w-3.5" />
          Payment History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payment-forecast')}
          className={[
            'text-button inline-flex items-center gap-2 px-6 py-3 transition-all duration-300',
            activeTab === 'payment-forecast'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Payment Forecast
        </button>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={closePreview}
            aria-label="Close preview"
          />
          <div className="relative z-10 w-full max-w-5xl h-[80vh] bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
              <h2 className="text-h3">Report Preview</h2>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleDownloadPreview}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button variant="ghost" onClick={closePreview}>
                  Close
                </Button>
              </div>
            </div>
            <iframe
              src={preview.url}
              title="Report preview"
              className="flex-1 w-full border-0 bg-white"
            />
          </div>
        </div>
      )}

      {activeTab === 'payment-history' && <PaymentHistory />}
      {activeTab === 'payment-forecast' && <PaymentForecast />}

      {activeTab === 'overview' && (
        <div>
          {isLoading ? (
            <LoadingState
              title="Loading portfolio reports"
              description="Fetching dashboard KPIs and budget summaries."
            />
          ) : overviewError ? (
            <ErrorState
              title="Unable to load overview"
              description="Please try again later."
            />
          ) : !overview ? (
            <EmptyState
              title="No reporting data yet."
              description="Reports will appear once projects, grants and payments are captured."
            />
          ) : (
            <>
              {/* Budget overview stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 mb-10">
                <StatCard
                  label="Allocated"
                  value={formatRands(overview.kpis.allocated)}
                  icon={<DollarSign className="h-5 w-5" />}
                  isCurrency
                />
                <StatCard
                  label="Spent"
                  value={formatRands(overview.kpis.spent)}
                  icon={<TrendingDown className="h-5 w-5" />}
                  isCurrency
                />
                <StatCard
                  label="Remaining"
                  value={formatRands(overview.kpis.remaining)}
                  icon={<Wallet className="h-5 w-5" />}
                  isCurrency
                />
              </div>

              {/* Department + service breakdown from overview API (mocked until backend). */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[var(--bg-card)] border border-[var(--border)]">
                  <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h3 className="text-h3">Department Budgets</h3>
                  </div>
                  <div className="px-6 py-4 space-y-2">
                    {overview.departments.map((dept) => (
                      <div key={dept.deptName} className="flex items-center justify-between">
                        <span className="text-[0.8rem] text-[var(--text-primary)]">
                          {dept.deptName}
                        </span>
                        <span className="text-[0.75rem] text-financial">
                          {formatRands(dept.totalBudget)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)]">
                  <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h3 className="text-h3">Service Category Breakdown</h3>
                  </div>
                  <div className="px-6 py-4 space-y-2">
                    {overview.serviceCategories.map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <span className="text-[0.8rem] text-[var(--text-primary)]">
                          {item.category}
                        </span>
                        <span className="text-[0.75rem] text-financial">
                          {formatRands(item.totalValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border)] mt-8">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                  <h3 className="text-h3">Active portfolio snapshot (mock)</h3>
                  <p className="text-[0.72rem] text-[var(--text-muted)] mt-1">
                    Same rows as the projects list fixture; will bind to live portfolio when the API is ready.
                  </p>
                </div>
                <div className="px-6 py-4 divide-y divide-[var(--border)]">
                  {MOCK_PORTFOLIO_PROJECTS.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-[0.82rem] font-medium text-[var(--text-primary)]">{p.name}</p>
                        <p className="text-[0.68rem] text-[var(--text-muted)]">
                          {SERVICE_CATEGORY_LABELS[p.serviceCategory]} · {p.ref}
                        </p>
                      </div>
                      <span className="text-[0.78rem] text-financial">{formatRands(p.contractValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
