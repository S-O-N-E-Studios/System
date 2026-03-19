import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import StageTimeline from '@/components/ui/StageTimeline';
import StageDocumentDrawer from '@/components/ui/StageDocumentDrawer';
import PaymentForecastChart from '@/components/ui/PaymentForecastChart';
import { formatRands } from '@/utils/formatters';
import { ArrowLeft, Edit, FileText, Clock, Check, X } from 'lucide-react';
import ProjectLocationMap from '@/components/ui/ProjectLocationMap';
import ProjectActivitySchedule from './ProjectActivitySchedule';
import { STAGE_DOCUMENT_REQUIREMENTS } from '@/constants/stageDocuments';
import type { ProjectStage, StageDocumentRequirement } from '@/types';

const detailTabs = [
  'Overview',
  'Professional Services',
  'Geo-Technical',
  'Construction',
  'Activity Schedule',
  'Files',
  'Funding Sources',
] as const;

/* Mock stage gate status (v6.0) */
const MOCK_CURRENT_STAGE: ProjectStage = 4;
const MOCK_STAGE_DOCUMENTS: StageDocumentRequirement[] = (() => {
  const reqs = STAGE_DOCUMENT_REQUIREMENTS[4];
  return reqs.map((r, i) => ({
    documentName: r.documentName,
    category: r.category,
    uploaded: i < 2, // First 2 uploaded, rest missing
    fileName: i < 2 ? `${r.documentName.replace(/\s/g, '-')}.pdf` : undefined,
  }));
})();

/* Mock multi-year payment forecast */
const MOCK_PAYMENT_PLAN = [
  { year: 2026, q1: 4_500_000, q2: 6_200_000, q3: 5_800_000, q4: 3_500_000 },
  { year: 2027, q1: 2_800_000, q2: 4_100_000, q3: 3_600_000, q4: 2_200_000 },
  { year: 2028, q1: 1_500_000, q2: 2_000_000, q3: 0, q4: 0 },
];

/* Mock documents */
const MOCK_DOCS = [
  { id: '1', name: 'PBD.pdf', category: 'payment-certificate', uploadedAt: '12 Jan 2026' },
  { id: '2', name: 'DA Approval.pdf', category: 'tender', uploadedAt: '15 Jan 2026' },
  { id: '3', name: 'Tender Document.pdf', category: 'tender', uploadedAt: '20 Jan 2026' },
  { id: '4', name: 'Site Drawings v3.dwg', category: 'drawing', uploadedAt: '22 Feb 2026' },
  { id: '5', name: 'Geotechnical Report.pdf', category: 'geotechnical', uploadedAt: '5 Feb 2026' },
];

/* Mock monthly payment forecast/actual for Construction tab chart */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MOCK_FORECAST_MONTHLY = MONTHS.map((m, i) => ({
  month: m,
  amount: i < 9 ? 4_500_000 + (i % 3) * 500_000 : 2_000_000,
}));
const MOCK_ACTUAL_MONTHLY = MONTHS.map((m, i) => ({
  month: m,
  amount: Math.round((4_200_000 + (i % 4) * 300_000) * (i < 3 ? 0.9 : 1)),
}));

/* Mock funding sources */
const MOCK_FUNDING_SOURCES = [
  { id: '1', name: 'MIG', total: 25_000_000, disbursed: 9_500_000, remaining: 15_500_000 },
  { id: '2', name: 'WSIG', total: 12_000_000, disbursed: 4_200_000, remaining: 7_800_000 },
  { id: '3', name: 'Provincial Budget', total: 8_000_000, disbursed: 1_500_000, remaining: 6_500_000 },
];

/* Professional Services: stages 1–4 documents flattened */
const PROF_SERVICES_DOCS = (() => {
  const out: { documentName: string; category: string; stage: number; uploaded: boolean; fileName?: string }[] = [];
  ([1, 2, 3, 4] as const).forEach((stage) => {
    const reqs = STAGE_DOCUMENT_REQUIREMENTS[stage];
    reqs.forEach((r, i) => {
      out.push({
        documentName: r.documentName,
        category: r.category,
        stage,
        uploaded: stage < MOCK_CURRENT_STAGE || (stage === MOCK_CURRENT_STAGE && i < 2),
        fileName: stage < MOCK_CURRENT_STAGE || (stage === MOCK_CURRENT_STAGE && i < 2)
          ? `${r.documentName.replace(/\s/g, '-')}.pdf`
          : undefined,
      });
    });
  });
  return out;
})();

/* Geo-Technical related documents */
const GEO_TECH_DOCS = [
  { name: 'Geotechnical Investigation Report', category: 'geotechnical', uploaded: true, fileName: 'Geo-Report-R573.pdf' },
  { name: 'Digital Survey Data', category: 'digital-survey', uploaded: true, fileName: 'Survey-2026-01.dwg' },
  { name: 'Environmental Impact Assessment', category: 'environmental', uploaded: false },
  { name: 'Soil Test Results', category: 'geotechnical', uploaded: true, fileName: 'Soil-Tests.pdf' },
  { name: 'Topographical Survey', category: 'digital-survey', uploaded: false },
];

function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState(() => {
    return Math.max(0, new Date(targetDate).getTime() - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, new Date(targetDate).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return { days, hours, minutes, seconds, isExpired: remaining <= 0 };
}

export default function ProjectDetail() {
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
  const [activeTab, setActiveTab] = useState<typeof detailTabs[number]>('Overview');
  const [stageDrawerOpen, setStageDrawerOpen] = useState<ProjectStage | null>(null);
  const countdown = useCountdown('2026-11-30');
  const currentStage = MOCK_CURRENT_STAGE;
  const completedStages = [1, 2, 3] as ProjectStage[];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          to={`/${tenantSlug}/projects`}
          className="text-[var(--text-muted)] hover:text-[var(--accent-sand)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-mono">PRJ-2026-001</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 mb-1">R573 Road Rehabilitation</h1>
          <StatusBadge status="active">Active</StatusBadge>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/${tenantSlug}/projects/${id}/edit`}>
            <Button variant="secondary">
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-0 border-b border-[var(--border-default)] mb-8 overflow-x-auto">
        {detailTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'text-button px-5 py-3 whitespace-nowrap transition-all duration-300',
              activeTab === tab
                ? 'text-[var(--accent-sand)] border-b-2 border-[var(--accent-sand)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══ Overview Tab ═══ */}
      {activeTab === 'Overview' && (
        <div className="space-y-8">
          {/* KPI row + Countdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-0">
            {[
              { label: 'Contract Value', value: formatRands(45_000_000) },
              { label: 'Expenditure', value: formatRands(15_200_000) },
              { label: 'Balance', value: formatRands(29_800_000) },
              { label: '% Complete', value: '38%' },
            ].map((kpi) => (
              <div key={kpi.label} className="p-5 border border-[var(--border-default)] bg-[var(--bg-surface)]">
                <p className="text-eyebrow mb-2">{kpi.label}</p>
                <p className="text-currency text-[1rem]">{kpi.value}</p>
              </div>
            ))}
            <div className="p-5 border border-[var(--border-default)] bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3 w-3 text-[var(--accent-periwinkle)]" />
                <p className="text-eyebrow">Completion</p>
              </div>
              {countdown.isExpired ? (
                <p className="text-[0.82rem] font-semibold text-[var(--status-success)]">Due</p>
              ) : (
                <p style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[1rem] font-semibold text-[var(--text-primary)]">
                  {countdown.days}d {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>

          {/* 6-Stage Project Lifecycle Timeline (v6.0) */}
          <StageTimeline
            currentStage={currentStage}
            completedStages={completedStages}
            onStageClick={(stage) => setStageDrawerOpen(stage)}
          />
          {stageDrawerOpen != null && (
            <StageDocumentDrawer
              stage={stageDrawerOpen}
              projectId={id ?? ''}
              documents={
                stageDrawerOpen === 4
                  ? MOCK_STAGE_DOCUMENTS
                  : STAGE_DOCUMENT_REQUIREMENTS[stageDrawerOpen].map((r) => ({
                      documentName: r.documentName,
                      category: r.category,
                      uploaded: stageDrawerOpen < currentStage,
                    }))
              }
              gatePassed={false}
              onClose={() => setStageDrawerOpen(null)}
              onAdvanceStage={() => setStageDrawerOpen(null)}
            />
          )}

          {/* Two-column: Multi-year payment plan + Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Multi-year Payment Plan - enlarged for readability */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-6 py-5 w-full">
              <h3 className="text-h3 mb-4">Multi-Year Payment Plan</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[0.85rem]">
                  <thead>
                    <tr className="bg-[var(--accent-sand)]">
                      <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Year</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Q1</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Q2</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Q3</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Q4</th>
                      <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PAYMENT_PLAN.map((row, i) => {
                      const total = row.q1 + row.q2 + row.q3 + row.q4;
                      return (
                        <tr
                          key={row.year}
                          className={`border-t border-[var(--border-default)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                        >
                          <td className="px-4 py-3 text-[0.85rem] font-medium text-[var(--text-primary)]">{row.year}</td>
                          <td className="px-4 py-3 text-right text-financial text-[0.85rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {row.q1 ? formatRands(row.q1) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-financial text-[0.85rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {row.q2 ? formatRands(row.q2) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-financial text-[0.85rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {row.q3 ? formatRands(row.q3) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-financial text-[0.85rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {row.q4 ? formatRands(row.q4) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-financial text-[0.9rem] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {formatRands(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mini line chart placeholder */}
              <div className="mt-4 h-24 bg-[var(--bg-surface-alt)] border border-dashed border-[var(--border-default)] flex items-center justify-center">
                <p className="text-[0.72rem] text-[var(--text-muted)]">
                  Multi-year payment trend chart (Recharts integration)
                </p>
              </div>
            </div>

            {/* Document Panel */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
              <h3 className="text-h3 mb-4">Project Documents</h3>
              <div className="flex flex-col gap-0">
                {MOCK_DOCS.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--accent-sand-glow)] transition-colors px-2 -mx-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[var(--accent-periwinkle)]" />
                      <div>
                        <p className="text-[0.82rem] text-[var(--text-primary)]">{doc.name}</p>
                        <p className="text-[0.62rem] text-[var(--text-muted)] uppercase tracking-wider">
                          {doc.category.replace(/-/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[0.62rem] text-[var(--text-muted)]">{doc.uploadedAt}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <p className="text-[0.68rem] text-[var(--status-danger)] font-medium">
                  Proof of payment not yet uploaded; required for project completion
                </p>
              </div>
            </div>
          </div>

          {/* Location + Key Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ProjectLocationMap
              address="R573, Mbombela, Mpumalanga"
              lat={-25.4753}
              lng={30.9694}
              gpsFormatted="-25.4753, 30.9694"
            />

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
              <h3 className="text-h3 mb-4">Key Information</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Department', value: 'DPW' },
                  { label: 'Start Date', value: '15 Jan 2026' },
                  { label: 'Completion Date', value: '30 Nov 2026' },
                  { label: 'Project Manager', value: 'Fortune Mabona' },
                  { label: 'Contractor', value: 'BuildCorp SA' },
                  { label: 'Geo-Tec Engineer', value: 'Geoscience Ltd' },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between py-2 border-b border-[var(--border-default)]">
                    <span className="text-[0.7rem] text-[var(--text-muted)]">{row.label}</span>
                    <span className="text-[0.82rem] text-[var(--text-primary)]">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-eyebrow mb-3">Progress</p>
                <ProgressBar value={38} height={4} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Activity Schedule Tab ═══ */}
      {activeTab === 'Activity Schedule' && <ProjectActivitySchedule />}

      {/* Expenditure (legacy) - Payment History */}
      {activeTab === 'Files' && id && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-8">
          <h3 className="text-h3 mb-4">Project Files</h3>
          <p className="text-body mb-6">
            9 file categories: payment certificates, tenders, drawings, digital surveys,
            geotechnical reports, environmental reports, proof of payment, activity images, and other.
          </p>
          <div className="flex flex-col gap-0">
            {MOCK_DOCS.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-[var(--accent-periwinkle)]" />
                  <div>
                    <p className="text-[0.82rem] text-[var(--text-primary)]">{doc.name}</p>
                    <p className="text-[0.62rem] text-[var(--text-muted)] uppercase tracking-wider">
                      {doc.category.replace(/-/g, ' ')}
                    </p>
                  </div>
                </div>
                <span className="text-[0.62rem] text-[var(--text-muted)]">{doc.uploadedAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Professional Services Tab ═══ */}
      {activeTab === 'Professional Services' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
          <h3 className="text-h3 mb-4">Stage Documents (Inception → Procurement)</h3>
          <p className="text-body mb-6">
            Checklist of required documents for stages 1–4: scoping, preliminary design, detailed design, and tender documentation.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[0.85rem]">
              <thead>
                <tr className="bg-[var(--accent-sand)]">
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Stage</th>
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Document</th>
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Category</th>
                  <th className="text-center px-4 py-3 text-[var(--text-primary)] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {PROF_SERVICES_DOCS.map((doc, i) => (
                  <tr
                    key={`${doc.stage}-${doc.documentName}`}
                    className={`border-t border-[var(--border-default)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                  >
                    <td className="px-4 py-3 text-[var(--text-primary)]">{doc.stage}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{doc.documentName}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {doc.category.replace(/-/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.uploaded ? (
                        <span className="inline-flex items-center gap-1 text-[var(--status-success)]">
                          <Check className="h-3.5 w-3.5" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--status-danger)]">
                          <X className="h-3.5 w-3.5" />
                          Missing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Geo-Technical Tab ═══ */}
      {activeTab === 'Geo-Technical' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
          <h3 className="text-h3 mb-4">Geo-Technical & Survey Documents</h3>
          <p className="text-body mb-6">
            Geotechnical reports, digital surveys, and environmental assessments required for site works.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[0.85rem]">
              <thead>
                <tr className="bg-[var(--accent-sand)]">
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Document</th>
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Category</th>
                  <th className="text-center px-4 py-3 text-[var(--text-primary)] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {GEO_TECH_DOCS.map((doc, i) => (
                  <tr
                    key={doc.name}
                    className={`border-t border-[var(--border-default)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                  >
                    <td className="px-4 py-3 text-[var(--text-primary)]">{doc.name}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {doc.category.replace(/-/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.uploaded ? (
                        <span className="inline-flex items-center gap-1 text-[var(--status-success)]">
                          <Check className="h-3.5 w-3.5" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--status-danger)]">
                          <X className="h-3.5 w-3.5" />
                          Missing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Construction Tab ═══ */}
      {activeTab === 'Construction' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Contract Value', value: formatRands(45_000_000) },
              { label: 'Paid to Date', value: formatRands(15_200_000) },
              { label: 'Remaining', value: formatRands(29_800_000) },
            ].map((kpi) => (
              <div key={kpi.label} className="p-5 border border-[var(--border-default)] bg-[var(--bg-surface)]">
                <p className="text-eyebrow mb-2">{kpi.label}</p>
                <p className="text-currency text-[1rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>
          <PaymentForecastChart
            forecastData={MOCK_FORECAST_MONTHLY}
            actualData={MOCK_ACTUAL_MONTHLY}
            title="Expected vs Actual Payments"
            height={320}
          />
        </div>
      )}

      {/* ═══ Funding Sources Tab ═══ */}
      {activeTab === 'Funding Sources' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
          <h3 className="text-h3 mb-4">Funding Sources</h3>
          <p className="text-body mb-6">
            MIG, WSIG, provincial budget, and other funding allocations with disbursed and remaining amounts.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[0.85rem]">
              <thead>
                <tr className="bg-[var(--accent-sand)]">
                  <th className="text-left px-4 py-3 text-[var(--text-primary)] font-medium">Source</th>
                  <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Total</th>
                  <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Disbursed</th>
                  <th className="text-right px-4 py-3 text-[var(--text-primary)] font-medium">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_FUNDING_SOURCES.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-t border-[var(--border-default)] ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface-alt)]'}`}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.name}</td>
                    <td className="px-4 py-3 text-right text-financial" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatRands(row.total)}
                    </td>
                    <td className="px-4 py-3 text-right text-financial" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatRands(row.disbursed)}
                    </td>
                    <td className="px-4 py-3 text-right text-financial" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatRands(row.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
