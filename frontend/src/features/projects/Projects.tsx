import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/types';
import { projectsApi } from '@/api/projects';
import { Plus, Search, Filter, Download, ChevronDown, ChevronUp, Paperclip, Star } from 'lucide-react';
import { formatDate, formatRands } from '@/utils/formatters';
import { exportPdf, exportXlsx } from '@/utils/clientExports';
import ExportDialog, { type ExportFormat } from '@/components/ui/ExportDialog';
import { useAuthStore } from '@/store/authStore';
import { useClientAccessStore } from '@/store/clientAccessStore';
import { fetchClientTempScope } from '@/api/clientAccess';
import { EMPTY_PINNED_LIST, useProjectStore } from '@/store/projectStore';

type ContractTab = 'ps' | 'geo' | 'cm';

const tabs: { key: ContractTab; label: string }[] = [
  { key: 'ps', label: 'Professional Services' },
  { key: 'geo', label: 'Geo-Technical' },
  { key: 'cm', label: 'Construction Management' },
];

type PortfolioTableProject = {
  id: string;
  name: string;
  ref: string;
  serviceCategory: ServiceCategory | '';
  localMunicipality: string;
  contractValue: number;
  expenditure: number;
  balance: number;
  status: 'active' | 'review' | 'planning' | 'done' | 'danger';
  gps: string;
  attachments: number;
  geoTecEngineer: string;
  geoTecReport: string;
  challenges: string;
  recommendation: string;
  ddrStatus: string;
  contractor: string;
  startDate: string;
  completionDate: string;
  percentComplete: number;
  constructionStatus: 'on_track' | 'at_risk' | 'delayed' | 'complete';
};

function normalizeProjectsListResponse(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object' && 'projects' in raw) {
    const projects = (raw as { projects: unknown }).projects;
    if (Array.isArray(projects)) return projects as Record<string, unknown>[];
  }
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return normalizeProjectsListResponse((raw as { data: unknown }).data);
  }
  return [];
}

function centsToRands(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n / 100 : 0;
}

function formatPortfolioDate(value: unknown): string {
  if (value == null || value === '') return '';
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return formatDate(s);
  return s;
}

function gpsFromRaw(raw: Record<string, unknown>): string {
  const coords = raw.gpsCoordinates;
  if (typeof coords === 'string') return coords;
  if (coords && typeof coords === 'object') {
    const c = coords as { lat?: unknown; lng?: unknown };
    if (c.lat != null && c.lng != null) return `${c.lat}, ${c.lng}`;
  }
  if (typeof raw.gpsFormatted === 'string') return raw.gpsFormatted;
  const loc = raw.location as { lat?: unknown; lng?: unknown } | undefined;
  if (loc && loc.lat != null && loc.lng != null) return `${loc.lat}, ${loc.lng}`;
  return '';
}

function mapGeoTecReportStatus(raw: unknown): string {
  const s = String(raw ?? 'pending');
  if (s === 'submitted' || s === 'in_review' || s === 'pending') return s;
  return 'pending';
}

function mapProfessionalStatusBadge(
  status: unknown,
  currentStage: unknown,
): 'active' | 'review' | 'planning' | 'done' | 'danger' {
  const st = String(status ?? 'active');
  if (st === 'complete') return 'done';
  if (st === 'cancelled') return 'danger';
  if (st === 'on-hold') return 'review';
  const stage = Number(currentStage);
  const s = Number.isFinite(stage) ? stage : 1;
  if (s <= 2) return 'planning';
  if (s >= 9) return 'review';
  return 'active';
}

function mapConstructionStatus(raw: unknown): 'on_track' | 'at_risk' | 'delayed' | 'complete' {
  const s = String(raw ?? 'on_track');
  if (s === 'on_track' || s === 'at_risk' || s === 'delayed' || s === 'complete') return s;
  return 'on_track';
}

function mapApiProjectToPortfolioRow(raw: Record<string, unknown>): PortfolioTableProject {
  const contractValue = centsToRands(raw.contractValueAdjusted ?? raw.contractValue);
  const expenditure = centsToRands(
    (raw as { totalExpenditure?: unknown }).totalExpenditure ?? raw.expenditureToDate,
  );
  const sc = raw.serviceCategory;
  const serviceCategory: ServiceCategory | '' =
    typeof sc === 'string' && sc in SERVICE_CATEGORY_LABELS ? (sc as ServiceCategory) : '';

  return {
    id: String(raw._id ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    ref: String(raw.projectCode ?? raw.refCode ?? raw.ref ?? ''),
    serviceCategory,
    localMunicipality: String(raw.localMunicipality ?? ''),
    contractValue,
    expenditure,
    balance: contractValue - expenditure,
    status: mapProfessionalStatusBadge(raw.status, raw.currentStage),
    gps: gpsFromRaw(raw),
    attachments: Number((raw as { attachmentCount?: unknown }).attachmentCount ?? 0) || 0,
    geoTecEngineer: String(raw.geoTecEngineer ?? ''),
    geoTecReport: mapGeoTecReportStatus(raw.geoTecReportStatus ?? raw.geoTecReport),
    challenges: String(raw.challenges ?? ''),
    recommendation: String(raw.recommendation ?? ''),
    ddrStatus: String(raw.ddrStatus ?? 'pending'),
    contractor: String(raw.contractor ?? ''),
    startDate: formatPortfolioDate(raw.startDate ?? raw.appointmentDate),
    completionDate: formatPortfolioDate(raw.completionDate),
    percentComplete: Math.min(100, Math.max(0, Number(raw.percentComplete ?? 0) || 0)),
    constructionStatus: mapConstructionStatus(raw.constructionStatus),
  };
}

export default function Projects() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [activeTab, setActiveTab] = useState<ContractTab>('ps');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<ServiceCategory | ''>('');
  const [exportOpen, setExportOpen] = useState(false);

  const { user } = useAuthStore();
  const tenantRole = user && tenantSlug ? user.tenants.find((t) => t.slug === tenantSlug)?.role : undefined;
  const isClientTemp = tenantRole === 'CLIENT_TEMP';

  const { expiresAt, allowedProjectIds, setAllowedProjectIds, setExpiresAt, clearClientTempScope } =
    useClientAccessStore();

  const togglePinnedProject = useProjectStore((s) => s.togglePinnedProject);
  const pinnedForTenant = useProjectStore((s) =>
    tenantSlug ? (s.pinnedProjectsByTenant[tenantSlug] ?? EMPTY_PINNED_LIST) : EMPTY_PINNED_LIST,
  );
  const setFilters = useProjectStore((s) => s.setFilters);
  const searchQuery = useProjectStore((s) => s.tableFilters.search ?? '');
  const isPinned = (projectId: string) => pinnedForTenant.some((p) => p.id === projectId);

  useEffect(() => {
    let cancelled = false;

    async function hydrateClientTempScope() {
      if (!tenantSlug || !isClientTemp) return;
      if (expiresAt && allowedProjectIds.length > 0) return;

      clearClientTempScope();

      try {
        const res = await fetchClientTempScope({ tenantSlug });
        if (cancelled) return;
        setAllowedProjectIds(res.allowedProjectIds);
        setExpiresAt(res.expiresAt);
      } catch {
        if (cancelled) return;
        // If backend blocks the request, keep banner scoped off.
      }
    }

    void hydrateClientTempScope();

    return () => {
      cancelled = true;
    };
  }, [
    tenantSlug,
    isClientTemp,
    expiresAt,
    allowedProjectIds.length,
    setAllowedProjectIds,
    setExpiresAt,
    clearClientTempScope,
  ]);

  const { data: apiProjects = [] } = useQuery({
    queryKey: ['projects', tenantSlug],
    queryFn: async () => {
      const res = await projectsApi.list({ tenantSlug: tenantSlug || '' } as never);
      return normalizeProjectsListResponse(res);
    },
    enabled: Boolean(tenantSlug),
  });

  const portfolioProjects = useMemo(
    () => apiProjects.map((p) => mapApiProjectToPortfolioRow(p)),
    [apiProjects],
  );

  const toggleDrillDown = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const filteredProjects = useMemo(
    () =>
      portfolioProjects.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
        const matchesService = !serviceCategoryFilter || p.serviceCategory === serviceCategoryFilter;
        const matchesClientScope = !isClientTemp || allowedProjectIds.includes(p.id);
        return matchesSearch && matchesService && matchesClientScope;
      }),
    [portfolioProjects, searchQuery, serviceCategoryFilter, isClientTemp, allowedProjectIds],
  );

  const showEmpty = filteredProjects.length === 0;

  type ProjectExportRow = {
    projectName: string;
    ref: string;
    serviceCategory: string;
    localMunicipality: string;
    gps: string;
    contractValue: string;
    expenditure: string;
    balance: string;
    status: string;
  };

  const handleExport = async (format: ExportFormat) => {
    if (format === 'both') {
      await handleExport('pdf');
      await handleExport('xlsx');
      return;
    }
    const rows: ProjectExportRow[] = filteredProjects.map((p) => ({
      projectName: p.name,
      ref: p.ref,
      serviceCategory: p.serviceCategory ? SERVICE_CATEGORY_LABELS[p.serviceCategory] : 'N/A',
      localMunicipality: p.localMunicipality || 'N/A',
      gps: p.gps || 'N/A',
      contractValue: isClientTemp ? '—— Restricted' : formatRands(p.contractValue),
      expenditure: isClientTemp ? '—— Restricted' : formatRands(p.expenditure),
      balance: isClientTemp ? '—— Restricted' : formatRands(p.balance),
      status: p.status === 'active' ? 'Active' : p.status === 'review' ? 'In Review' : p.status === 'planning' ? 'Not Started' : 'Complete',
    }));

    const columns: { key: keyof ProjectExportRow; header: string }[] = [
      { key: 'projectName', header: 'Project Name' },
      { key: 'ref', header: 'Ref' },
      { key: 'serviceCategory', header: 'Service Category' },
      { key: 'localMunicipality', header: 'Local Municipality' },
      { key: 'gps', header: 'GPS' },
      { key: 'contractValue', header: 'Contract Value' },
      { key: 'expenditure', header: 'Expenditure' },
      { key: 'balance', header: 'Balance' },
      { key: 'status', header: 'Status' },
    ];

    const tabLabel = tabs.find((t) => t.key === activeTab)?.label ?? '';
    const subtitleParts = [
      `${filteredProjects.length} project${filteredProjects.length === 1 ? '' : 's'}`,
      tabLabel,
      serviceCategoryFilter ? `Category: ${SERVICE_CATEGORY_LABELS[serviceCategoryFilter]}` : null,
      searchQuery.trim() ? `Search: "${searchQuery.trim()}"` : null,
    ].filter(Boolean);
    const subtitle = subtitleParts.join(' · ');

    const filename = `Projects.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
    if (format === 'xlsx') {
      await exportXlsx<ProjectExportRow>({ filename, sheetName: 'Projects', columns, rows });
    } else {
      exportPdf<ProjectExportRow>({
        filename,
        title: 'Projects',
        subtitle,
        columns,
        rows,
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Projects</h1>
        {!isClientTemp && (
          <Link to={`/${tenantSlug}/projects/new`}>
            <Button variant="primary">
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Tab row */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-6 overflow-x-auto scrollbar-hidden">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'text-button px-6 py-3 transition-all duration-300',
              activeTab === tab.key
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 sticky top-16 z-10 bg-[var(--bg-primary)] py-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => {
              const raw = e.target.value;
              const next = raw.trim() ? raw : undefined;
              setFilters({ search: next });
            }}
            className="w-full bg-transparent border-0 border-b border-[var(--border)] pl-6 pr-4 py-1.5 font-body text-[0.82rem] font-light text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-[border-color] duration-200"
          />
        </div>
        <select
          value={serviceCategoryFilter}
          onChange={(e) => setServiceCategoryFilter(e.target.value as ServiceCategory | '')}
          className="bg-transparent border border-[var(--border)] px-3 py-1.5 text-[0.82rem] text-[var(--text-primary)] min-w-[180px]"
        >
          <option value="">All service categories</option>
          {(Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategory[]).map((k) => (
            <option key={k} value={k}>{SERVICE_CATEGORY_LABELS[k]}</option>
          ))}
        </select>
        <Button variant="secondary" className="!min-w-0 !px-4">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </Button>
        <Button
          variant="secondary"
          className="!min-w-0 !px-4"
          onClick={() => setExportOpen(true)}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Professional Services Table */}
      {activeTab === 'ps' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] overflow-x-auto">
          {showEmpty ? (
            <EmptyState
              title={searchQuery.trim() ? 'No projects match your search.' : 'No projects yet.'}
              description={searchQuery.trim() ? 'Try a different search term.' : 'Create your first project to get started.'}
            />
          ) : (
          <table className="w-full min-w-[900px] table-fixed">
            <colgroup>
              <col className="w-[23%]" />
              <col className="w-[10%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
              <col className="w-[7%]" />
              <col className="w-[2%]" />
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                {['Project Name', 'Ref', 'Service Category', 'Local Municipality', 'Contract Value', 'Expenditure', 'Balance', 'Status', ''].map((h) => (
                  <th key={h} className="text-table-header text-left px-3 py-3 truncate">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, i) => (
                <Fragment key={p.id}>
                  <tr
                    className={[
                      'group border-b border-[var(--border)] cursor-pointer transition-all duration-300',
                      'hover:bg-[var(--accent-glow)] hover:border-l-2 hover:border-l-[var(--accent)]',
                      i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]',
                    ].join(' ')}
                  >
                    <td className="px-3 py-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {!isClientTemp && (
                          <button
                            type="button"
                            aria-label={isPinned(p.id) ? 'Unpin project' : 'Pin project'}
                            aria-pressed={isPinned(p.id)}
                            className={[
                              'shrink-0 p-1 rounded-sm transition-colors',
                              isPinned(p.id)
                                ? 'text-[var(--accent-sand)] hover:text-[var(--accent)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--accent-sand)]',
                              'hover:bg-[var(--accent-sand-glow)]',
                            ].join(' ')}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!tenantSlug) return;
                              togglePinnedProject(tenantSlug, { id: p.id, name: p.name, ref: p.ref });
                            }}
                          >
                            <Star
                              className="h-3.5 w-3.5"
                              fill={isPinned(p.id) ? 'currentColor' : 'none'}
                            />
                          </button>
                        )}
                        <Link
                          to={`/${tenantSlug}/projects/${p.id}`}
                          className="block truncate text-[0.82rem] font-body font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                        >
                          {p.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-mono min-w-0 truncate">{p.ref}</td>
                    <td className="px-3 py-3 text-[0.78rem] text-[var(--text-muted)] min-w-0 truncate">
                      {p.serviceCategory ? SERVICE_CATEGORY_LABELS[p.serviceCategory] : 'N/A'}
                    </td>
                    <td className="px-3 py-3 text-[0.78rem] text-[var(--text-muted)] min-w-0 truncate">
                      {p.localMunicipality || 'N/A'}
                    </td>
                    <td className="px-3 py-3 text-currency">
                      {isClientTemp ? '—— Restricted' : formatRands(p.contractValue)}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleDrillDown(p.id)}
                        className="flex items-center gap-1 text-currency cursor-pointer"
                      >
                        {isClientTemp ? '—— Restricted' : formatRands(p.expenditure)}
                        {expandedRow === p.id
                          ? <ChevronUp className="h-3 w-3 text-[var(--accent)]" />
                          : <ChevronDown className="h-3 w-3 text-[var(--accent)]" />
                        }
                      </button>
                    </td>
                    <td
                      className={`px-3 py-3 text-currency ${
                        !isClientTemp && p.balance >= 0 ? '!text-[var(--status-active)]' : ''
                      } ${
                        !isClientTemp && p.balance < 0 ? '!text-[var(--status-danger)]' : ''
                      }`}
                    >
                      {isClientTemp ? '—— Restricted' : formatRands(p.balance)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={p.status}>
                        {p.status === 'active' ? 'Active' : p.status === 'review' ? 'In Review' : p.status === 'planning' ? 'Not Started' : 'Complete'}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-[var(--text-muted)] hover:text-[var(--accent)]" aria-label="Attachments">
                          <Paperclip className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[0.6rem] text-[var(--text-muted)]">{p.attachments}</span>
                      </div>
                    </td>
                  </tr>
                  {/* Drill-down panel */}
                  {expandedRow === p.id && (
                    <tr key={`${p.id}-drill`}>
                      <td colSpan={9} className="px-4 py-4 bg-[var(--accent-sand-glow)] border-t border-[var(--accent)]">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 text-center">
                            <p className="text-[0.7rem] font-body font-medium text-[var(--text-primary)] mb-2">GPS Coordinates</p>
                            <p className="text-[0.72rem] text-mono text-[var(--text-muted)] truncate">{p.gps || 'N/A'}</p>
                          </div>
                          {['Monthly Progress Report', 'Tender Document', 'Drawings', 'PDR'].map((doc) => (
                            <div key={doc} className="bg-[var(--bg-card)] border border-[var(--border)] p-4 text-center">
                              <p className="text-[0.7rem] font-body font-medium text-[var(--text-primary)] mb-2">{doc}</p>
                              <StatusBadge status="active">Submitted</StatusBadge>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          )}
        </div>
      )}

      {/* Geo-Technical Table */}
      {activeTab === 'geo' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] overflow-x-auto">
          {showEmpty ? (
            <EmptyState
              title={searchQuery.trim() ? 'No projects match your search.' : 'No projects yet.'}
              description={searchQuery.trim() ? 'Try a different search term.' : 'Create your first project to get started.'}
            />
          ) : (
          <table className="w-full min-w-[800px] table-fixed">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                {['Project Name', 'Geo-Tec Engineer', 'Project Value', 'Geo-Tec Report', 'Expenditure', 'Challenges', 'Recommendation', 'DDR Status'].map((h) => (
                  <th key={h} className="text-table-header text-left px-4 py-3 truncate">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, i) => (
                <tr
                  key={p.id}
                  className={[
                    'border-b border-[var(--border)] cursor-pointer transition-all duration-300',
                    'hover:bg-[var(--accent-glow)] hover:border-l-2 hover:border-l-[var(--accent)]',
                    i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {!isClientTemp && (
                        <button
                          type="button"
                          aria-label={isPinned(p.id) ? 'Unpin project' : 'Pin project'}
                          aria-pressed={isPinned(p.id)}
                          className={[
                            'shrink-0 p-1 rounded-sm transition-colors',
                            isPinned(p.id)
                              ? 'text-[var(--accent-sand)] hover:text-[var(--accent)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--accent-sand)]',
                            'hover:bg-[var(--accent-sand-glow)]',
                          ].join(' ')}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!tenantSlug) return;
                            togglePinnedProject(tenantSlug, { id: p.id, name: p.name, ref: p.ref });
                          }}
                        >
                          <Star className="h-3.5 w-3.5" fill={isPinned(p.id) ? 'currentColor' : 'none'} />
                        </button>
                      )}
                      <Link
                        to={`/${tenantSlug}/projects/${p.id}`}
                        className="block truncate text-[0.82rem] font-body font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                      >
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-table-cell min-w-0 truncate">
                    {p.geoTecEngineer || <span className="italic text-[var(--text-muted)]">Not Appointed</span>}
                  </td>
                    <td className="px-4 py-3 text-currency">
                      {isClientTemp ? '—— Restricted' : formatRands(p.contractValue)}
                    </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.geoTecReport === 'submitted' ? 'active' : p.geoTecReport === 'in_review' ? 'review' : 'planning'}>
                      {p.geoTecReport === 'submitted' ? 'Submitted' : p.geoTecReport === 'in_review' ? 'In Review' : 'Pending'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-currency">
                    {isClientTemp ? '—— Restricted' : formatRands(p.expenditure)}
                  </td>
                  <td className="px-4 py-3 text-table-cell max-w-[200px] truncate">{p.challenges || 'N/A'}</td>
                  <td className="px-4 py-3 text-table-cell max-w-[200px] truncate">{p.recommendation || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.ddrStatus === 'complete' ? 'done' : p.ddrStatus === 'in_review' ? 'review' : 'planning'}>
                      {p.ddrStatus === 'complete' ? 'Complete' : p.ddrStatus === 'in_review' ? 'In Review' : 'Pending'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      )}

      {/* Construction Management Table */}
      {activeTab === 'cm' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] overflow-x-auto">
          {showEmpty ? (
            <EmptyState
              title={searchQuery.trim() ? 'No projects match your search.' : 'No projects yet.'}
              description={searchQuery.trim() ? 'Try a different search term.' : 'Create your first project to get started.'}
            />
          ) : (
          <table className="w-full min-w-[800px] table-fixed">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                {['Project Name', 'Contractor', 'Contract Value', 'Start Date', 'Completion Date', 'Expenditure', '% Complete', 'Status'].map((h) => (
                  <th key={h} className="text-table-header text-left px-4 py-3 truncate">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, i) => (
                <tr
                  key={p.id}
                  className={[
                    'border-b border-[var(--border)] cursor-pointer transition-all duration-300',
                    'hover:bg-[var(--accent-glow)] hover:border-l-2 hover:border-l-[var(--accent)]',
                    i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {!isClientTemp && (
                        <button
                          type="button"
                          aria-label={isPinned(p.id) ? 'Unpin project' : 'Pin project'}
                          aria-pressed={isPinned(p.id)}
                          className={[
                            'shrink-0 p-1 rounded-sm transition-colors',
                            isPinned(p.id)
                              ? 'text-[var(--accent-sand)] hover:text-[var(--accent)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--accent-sand)]',
                            'hover:bg-[var(--accent-sand-glow)]',
                          ].join(' ')}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!tenantSlug) return;
                            togglePinnedProject(tenantSlug, { id: p.id, name: p.name, ref: p.ref });
                          }}
                        >
                          <Star className="h-3.5 w-3.5" fill={isPinned(p.id) ? 'currentColor' : 'none'} />
                        </button>
                      )}
                      <Link
                        to={`/${tenantSlug}/projects/${p.id}`}
                        className="block truncate text-[0.82rem] font-body font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                      >
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-table-cell min-w-0 truncate">
                    {p.contractor || <span className="italic text-[var(--text-muted)]">Not Appointed</span>}
                  </td>
                  <td className="px-4 py-3 text-currency">
                    {isClientTemp ? '—— Restricted' : formatRands(p.contractValue)}
                  </td>
                  <td className="px-4 py-3 text-table-cell text-[var(--text-muted)]">{p.startDate}</td>
                  <td className="px-4 py-3 text-table-cell">{p.completionDate}</td>
                  <td className="px-4 py-3 text-currency">
                    {isClientTemp ? '—— Restricted' : formatRands(p.expenditure)}
                  </td>
                  <td className="px-4 py-3 w-[160px]">
                    <ProgressBar value={p.percentComplete} height={4} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={
                      p.constructionStatus === 'on_track' ? 'active' :
                      p.constructionStatus === 'at_risk' ? 'review' :
                      p.constructionStatus === 'delayed' ? 'danger' : 'done'
                    }>
                      {p.constructionStatus === 'on_track' ? 'On Track' :
                       p.constructionStatus === 'at_risk' ? 'At Risk' :
                       p.constructionStatus === 'delayed' ? 'Delayed' : 'Complete'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      )}

      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        context="Projects"
        onExport={handleExport}
      />
    </div>
  );
}
