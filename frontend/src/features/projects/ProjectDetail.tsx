import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import PaymentHistoryTable from '@/components/ui/PaymentHistoryTable';
import PaymentForecastChart from '@/components/ui/PaymentForecastChart';
import { useProject, useProjectPayments, useProjectPaymentForecast } from '@/hooks/useProjects';
import { useFiles } from '@/hooks/useFiles';
import { filesApi } from '@/api/files';
import { formatRands } from '@/utils/formatters';
import { ArrowLeft, Edit, MapPin, Upload, Download, FileText } from 'lucide-react';
import ProjectActivitySchedule from './ProjectActivitySchedule';

type BadgeStatus = 'active' | 'review' | 'planning' | 'done' | 'danger' | 'accent';

function projectStatusToBadge(status: string): { badge: BadgeStatus; label: string } {
  switch (status) {
    case 'active': return { badge: 'active', label: 'Active' };
    case 'in_review': return { badge: 'review', label: 'In Review' };
    case 'not_started': return { badge: 'planning', label: 'Not Started' };
    case 'complete': return { badge: 'done', label: 'Complete' };
    case 'overdue': return { badge: 'danger', label: 'Overdue' };
    default: return { badge: 'planning', label: status };
  }
}

const detailTabs = ['Overview', 'Professional Services', 'Geo-Technical', 'Construction', 'Activity', 'Files'] as const;

export default function ProjectDetail() {
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
  const [activeTab, setActiveTab] = useState<typeof detailTabs[number]>('Overview');
  const { data: project, isLoading, error } = useProject(id);
  const { data: payments } = useProjectPayments(
    activeTab === 'Professional Services' ? id : undefined
  );
  const { data: forecast } = useProjectPaymentForecast(
    activeTab === 'Construction' ? id : undefined
  );
  const { data: filesData } = useFiles(activeTab === 'Files' ? { projectId: id } : undefined);

  if (isLoading) {
    return (
      <div className="min-h-[400px] relative">
        <LoadingOverlay fullscreen={false} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center">
        <p className="text-[0.82rem] text-[var(--status-danger)]">
          Failed to load project details.
        </p>
      </div>
    );
  }

  const expenditure = project.expenditureToDate;
  const balance = project.contractValue - expenditure;
  const percentSpent = project.contractValue > 0
    ? Math.round((expenditure / project.contractValue) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          to={`/${tenantSlug}/projects`}
          className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-mono">{project.referenceCode}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 mb-1">{project.name}</h1>
          <StatusBadge status={projectStatusToBadge(project.status).badge}>
            {projectStatusToBadge(project.status).label}
          </StatusBadge>
        </div>
        <Link to={`/${tenantSlug}/projects/${id}/edit`}>
          <Button variant="secondary">
            <Edit className="h-3.5 w-3.5" />
            Edit Project
          </Button>
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-8 overflow-x-auto">
        {detailTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'text-button px-5 py-3 whitespace-nowrap transition-all duration-300',
              activeTab === tab
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══════ Overview Tab ═══════ */}
      {activeTab === 'Overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-0">
            {[
              { label: 'Contract Value', value: formatRands(project.contractValue), isCurrency: true },
              { label: 'Expenditure', value: formatRands(expenditure), isCurrency: true },
              { label: 'Balance', value: formatRands(balance), isCurrency: true },
              { label: '% Spent', value: `${percentSpent}%`, isCurrency: false },
            ].map((kpi) => (
              <div key={kpi.label} className="p-6 border border-[var(--border)] bg-[var(--bg-card)]">
                <p className="text-eyebrow mb-2">{kpi.label}</p>
                <p className={kpi.isCurrency ? 'text-stat' : 'font-display text-[1.2rem] font-semibold text-[var(--text-primary)]'}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h3 className="text-h3 mb-4">Location</h3>
              <div className="aspect-video bg-[var(--bg-secondary)] border border-dashed border-[var(--border)] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-[var(--accent-dim)] mx-auto mb-2" />
                  <p className="text-mono">
                    {project.gpsLatitude && project.gpsLongitude
                      ? `${project.gpsLatitude}, ${project.gpsLongitude}`
                      : 'No GPS data'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h3 className="text-h3 mb-4">Key Information</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Start Date', value: project.startDate ? new Date(project.startDate).toLocaleDateString('en-ZA') : '—' },
                  { label: 'Completion Date', value: project.completionDate ? new Date(project.completionDate).toLocaleDateString('en-ZA') : '—' },
                  { label: 'Project Manager', value: project.projectManagerName ?? '—' },
                  { label: 'Contractor', value: project.contractor ?? '—' },
                  { label: 'Geo-Tec Engineer', value: project.geoTecEngineer ?? '—' },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[0.7rem] text-[var(--text-muted)]">{row.label}</span>
                    <span className="text-[0.82rem] text-[var(--text-primary)]">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-eyebrow mb-3">Progress</p>
                <ProgressBar value={project.percentComplete ?? 0} height={4} />
              </div>
            </div>
          </div>

          {project.mtef && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h3 className="text-h3 mb-4">MTEF Budget Allocation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Year 1', value: project.mtef.year1Budget },
                  { label: 'Year 2', value: project.mtef.year2Budget },
                  { label: 'Year 3', value: project.mtef.year3Budget },
                ].map((y) => (
                  <div key={y.label} className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <p className="text-eyebrow mb-1">{y.label}</p>
                    <p className="text-currency">{formatRands(y.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ Professional Services Tab ═══════ */}
      {activeTab === 'Professional Services' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-h3 mb-4">Professional Services Contract</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-eyebrow mb-1">Contract Value</p>
                <p className="text-stat">{formatRands(project.contractValue)}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-eyebrow mb-1">Expenditure to Date</p>
                <p className="text-stat">{formatRands(expenditure)}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-eyebrow mb-1">Balance</p>
                <p className="text-stat">{formatRands(balance)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-h3 mb-4">Payment History</h3>
            {payments && payments.length > 0 ? (
              <PaymentHistoryTable rows={payments} />
            ) : (
              <p className="text-[0.82rem] text-[var(--text-muted)] py-8 text-center">
                No payment records yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══════ Geo-Technical Tab ═══════ */}
      {activeTab === 'Geo-Technical' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-h3 mb-4">Geo-Technical Investigation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-eyebrow mb-2">Geo-Tec Engineer</p>
                <p className="text-[0.92rem] text-[var(--text-primary)]">{project.geoTecEngineer ?? 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-eyebrow mb-2">Report Status</p>
                <StatusBadge
                  status={
                    project.geoTecReportStatus === 'submitted' ? 'done' :
                    project.geoTecReportStatus === 'in_review' ? 'review' :
                    project.geoTecReportStatus === 'pending' ? 'planning' : 'accent'
                  }
                >
                  {project.geoTecReportStatus ?? 'Not Started'}
                </StatusBadge>
              </div>
              <div>
                <p className="text-eyebrow mb-2">DDR Status</p>
                <StatusBadge
                  status={
                    project.ddrStatus === 'complete' ? 'done' :
                    project.ddrStatus === 'in_review' ? 'review' : 'planning'
                  }
                >
                  {project.ddrStatus ?? 'Pending'}
                </StatusBadge>
              </div>
              <div>
                <p className="text-eyebrow mb-2">GPS Coordinates</p>
                <p className="text-mono">
                  {project.gpsLatitude && project.gpsLongitude
                    ? `${project.gpsLatitude}, ${project.gpsLongitude}`
                    : 'Not recorded'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-h3 mb-4">Document Checklist</h3>
            <div className="space-y-3">
              {[
                { name: 'Borehole Log Report', status: project.geoTecReportStatus ?? 'not_started' },
                { name: 'Desktop Design Report (DDR)', status: project.ddrStatus ?? 'pending' },
                { name: 'Environmental Impact Assessment', status: 'pending' },
                { name: 'Foundation Recommendations', status: project.geoTecReportStatus === 'submitted' ? 'submitted' : 'not_started' },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[0.82rem] text-[var(--text-primary)]">{doc.name}</span>
                  <StatusBadge status={
                    doc.status === 'submitted' || doc.status === 'complete' ? 'done' :
                    doc.status === 'in_review' ? 'review' :
                    doc.status === 'pending' ? 'planning' : 'accent'
                  }>
                    {doc.status === 'not_started' ? 'Not Started' :
                     doc.status === 'in_review' ? 'In Review' :
                     doc.status === 'submitted' ? 'Submitted' :
                     doc.status === 'complete' ? 'Complete' : doc.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Construction Tab ═══════ */}
      {activeTab === 'Construction' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-h3 mb-4">Construction Management</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-eyebrow mb-1">Contractor</p>
                <p className="text-[0.92rem] text-[var(--text-primary)]">{project.contractor ?? 'Not assigned'}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-eyebrow mb-1">Status</p>
                <StatusBadge status={
                  project.constructionStatus === 'on_track' ? 'active' :
                  project.constructionStatus === 'at_risk' ? 'review' :
                  project.constructionStatus === 'delayed' ? 'danger' : 'done'
                }>
                  {project.constructionStatus ?? 'Not Started'}
                </StatusBadge>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-eyebrow mb-1">Employees</p>
                <p className="font-display text-[1.2rem] font-semibold text-[var(--text-primary)]">{project.totalEmployees ?? 0}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-eyebrow mb-1">ROE %</p>
                <p className="font-display text-[1.2rem] font-semibold text-[var(--text-primary)]">{project.roePercent ?? 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-h3 mb-4">Payment Forecast vs Actual</h3>
            {forecast && forecast.length > 0 ? (
              <PaymentForecastChart
                forecastData={forecast.map((f) => ({
                  month: new Date(f.year, f.month - 1).toLocaleString('default', { month: 'short' }),
                  amount: f.forecastAmount,
                }))}
                actualData={forecast.map((f) => ({
                  month: new Date(f.year, f.month - 1).toLocaleString('default', { month: 'short' }),
                  amount: f.actualAmount,
                }))}
              />
            ) : (
              <p className="text-[0.82rem] text-[var(--text-muted)] py-8 text-center">
                No forecast data available.
              </p>
            )}
          </div>

          {project.challenges && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h3 className="text-h3 mb-3">Challenges</h3>
              <p className="text-body">{project.challenges}</p>
            </div>
          )}
          {project.recommendation && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h3 className="text-h3 mb-3">Recommendations</h3>
              <p className="text-body">{project.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════ Activity Tab ═══════ */}
      {activeTab === 'Activity' && <ProjectActivitySchedule />}

      {/* ═══════ Files Tab ═══════ */}
      {activeTab === 'Files' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-h3">Project Documents</h3>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && id) {
                      await filesApi.upload(file, id);
                      window.location.reload();
                    }
                  }}
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--bg-primary)] text-[0.75rem] font-body font-semibold tracking-wider uppercase hover:bg-[var(--accent-light)] transition-colors cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  Upload File
                </span>
              </label>
            </div>

            {filesData && filesData.data.length > 0 ? (
              <div className="space-y-2">
                {filesData.data.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[var(--accent-dim)]" />
                      <div>
                        <p className="text-[0.82rem] text-[var(--text-primary)]">{file.originalName}</p>
                        <p className="text-[0.65rem] text-[var(--text-muted)]">
                          {(file.size / 1024).toFixed(1)} KB · {file.uploadedByName} · {new Date(file.createdAt).toLocaleDateString('en-ZA')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const url = await filesApi.getDownloadUrl(file.id);
                        window.open(url, '_blank');
                      }}
                      className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[var(--border)] p-12 text-center">
                <FileText className="h-10 w-10 text-[var(--accent-dim)] mx-auto mb-3" />
                <p className="text-[0.82rem] text-[var(--text-muted)]">No files uploaded for this project.</p>
                <p className="text-[0.7rem] text-[var(--text-muted)] mt-1">Upload payment certificates, drawings, and other documents.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
