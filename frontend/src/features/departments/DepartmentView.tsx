import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatRands } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';
import apiClient from '@/api/client';
import { projectsApi } from '@/api/projects';
import { useTenantStore } from '@/store/tenantStore';
import type { Project, ProjectStatus } from '@/types';

function formatBudgetLabel(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  return `${amount}`;
}

type DepartmentProjectRow = {
  id: string;
  name: string;
  refCode: string;
  location: string;
  status: 'active' | 'review' | 'danger' | 'done';
  engineerCost: number;
  contractValue: number;
  expenditurePlan: number;
  expenditureActual: number;
  progressProjected: number;
  progressActual: number;
};

type DepartmentViewState = {
  name: string;
  fullName: string;
  programs: { name: string; budget: number; spent: number }[];
  projects: DepartmentProjectRow[];
};

function mapProjectStatus(status: ProjectStatus): DepartmentProjectRow['status'] {
  switch (status) {
    case 'active':
      return 'active';
    case 'on-hold':
      return 'review';
    case 'complete':
      return 'done';
    case 'cancelled':
    default:
      return 'danger';
  }
}

function mapProjectToRow(p: Project): DepartmentProjectRow {
  const contractValue = p.contractValue ?? p.contractValueAdjusted ?? 0;
  const expenditureToDate = p.expenditureToDate ?? 0;
  const stage = p.currentStage ?? 0;
  const progressProjected = Math.min(100, Math.round((stage / 10) * 100));
  const progressActual =
    contractValue > 0 ? Math.min(100, Math.round((expenditureToDate / contractValue) * 100)) : 0;

  return {
    id: p.id,
    name: p.name,
    refCode: p.refCode ?? '—',
    location: p.localMunicipality ?? p.location?.address ?? p.gpsFormatted ?? '—',
    status: mapProjectStatus(p.status),
    engineerCost: 0,
    contractValue,
    expenditurePlan: contractValue,
    expenditureActual: expenditureToDate,
    progressProjected,
    progressActual,
  };
}

function mapDepartmentPayload(
  raw: Record<string, unknown>,
  projects: Project[],
): DepartmentViewState {
  const name = String(raw.name ?? 'Department');
  const slug = typeof raw.slug === 'string' ? raw.slug : '';
  const head = typeof raw.headOfDept === 'string' && raw.headOfDept ? raw.headOfDept : '';
  const fullName = head || slug || '';

  const budgetTotal = Number(raw.budgetTotal) || 0;
  const budgetSpent = Number(raw.budgetSpent) || 0;
  const programsRaw = Array.isArray(raw.programs)
    ? (raw.programs as { name?: string; budget?: number }[])
    : [];

  const normalized = programsRaw.map((p) => ({
    name: String(p.name ?? 'Program'),
    budget: Math.max(0, Number(p.budget) || 0),
  }));

  const progBudgetSum = normalized.reduce((s, p) => s + p.budget, 0);

  let programs: { name: string; budget: number; spent: number }[];

  if (normalized.length > 0) {
    programs = normalized.map((p) => {
      const share = progBudgetSum > 0 ? p.budget / progBudgetSum : 1 / normalized.length;
      return {
        name: p.name,
        budget: Math.max(p.budget, 1),
        spent: Math.round(budgetSpent * share),
      };
    });
  } else if (budgetTotal > 0) {
    programs = [{ name: 'Total budget', budget: Math.max(budgetTotal, 1), spent: budgetSpent }];
  } else {
    programs = [];
  }

  return {
    name,
    fullName,
    programs,
    projects: projects.map(mapProjectToRow),
  };
}

const emptyDepartment: DepartmentViewState = {
  name: 'Department',
  fullName: '',
  programs: [],
  projects: [],
};

type DepartmentApiEnvelope = {
  success?: boolean;
  data?: { department?: Record<string, unknown> };
};

export default function DepartmentView() {
  const { tenantSlug, deptId } = useParams<{ tenantSlug: string; deptId: string }>();
  const navigate = useNavigate();
  const storeSlug = useTenantStore((s) => s.getSlug());
  const slug = tenantSlug ?? storeSlug ?? '';

  const [dept, setDept] = useState<DepartmentViewState>(emptyDepartment);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!deptId || !slug) {
        setDept(emptyDepartment);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [deptRes, listResult] = await Promise.all([
          apiClient.get<DepartmentApiEnvelope>(`/${slug}/departments/${deptId}`),
          projectsApi.list({ deptId, limit: 100 }).catch(() => ({ projects: [] as Project[], total: 0 })),
        ]);

        const payload = deptRes.data?.data?.department;
        if (cancelled) return;

        if (payload && typeof payload === 'object') {
          setDept(mapDepartmentPayload(payload as Record<string, unknown>, listResult.projects));
        } else {
          setDept(emptyDepartment);
        }
      } catch {
        if (!cancelled) setDept(emptyDepartment);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [deptId, slug]);

  const maxProgramBudget =
    dept.programs.length > 0 ? Math.max(...dept.programs.map((p) => p.budget), 1) : 1;

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="skeleton h-5 w-5 rounded" />
          <div className="skeleton h-3 w-24" />
        </div>
        <div className="skeleton h-8 w-64 mb-2" />
        <div className="skeleton h-4 w-96 mb-8" />
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-8 mb-8">
          <div className="skeleton h-6 w-40 mb-6" />
          <div className="skeleton h-[240px] w-full" />
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-x-auto">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          to={`/${tenantSlug}/dashboard`}
          className="text-[var(--text-muted)] hover:text-[var(--accent-sand)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-[0.72rem] text-[var(--text-muted)]">Dashboard</span>
      </div>
      <h1 className="text-h1 mb-2">{dept.name}</h1>
      <p className="text-body mb-8">{dept.fullName}</p>

      {/* Program budget bars: vertical columns */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-8 mb-8">
        <h3 className="text-h3 mb-6">Program Budgets</h3>
        <div className="flex items-end justify-between gap-6 h-[240px]">
          {dept.programs.map((prog, i) => {
            const barHeight = (prog.budget / maxProgramBudget) * 100;
            return (
              <div key={prog.name} className="flex-1 flex flex-col items-center gap-2">
                <span
                  className="text-financial text-[0.72rem]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {formatBudgetLabel(prog.budget)}
                </span>
                <div className="w-full max-w-[90px] relative" style={{ height: '180px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[var(--chart-bar-base)]"
                    style={{
                      height: `${barHeight}%`,
                      animation: `barGrow 0.8s ease-out ${i * 0.12}s both`,
                      transformOrigin: 'bottom',
                    }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[var(--chart-bar-fill)] opacity-90"
                      style={{
                        height: `${prog.budget > 0 ? Math.min(100, (prog.spent / prog.budget) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center leading-tight max-w-[100px]">
                  {prog.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-x-auto">
        <div className="px-6 py-4 border-b border-[var(--border-default)]">
          <h3 className="text-h3">Projects</h3>
        </div>
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              {[
                'Project Name',
                'Ref No',
                'Location',
                'Status',
                'Engineer Cost',
                'Contract Value',
                'Expenditure Plan',
                'Expenditure Actual',
                'Progress Proj.',
                'Progress Actual',
              ].map((h) => (
                <th key={h} className="text-table-header text-left px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dept.projects.map((project, i) => (
              <tr
                key={project.id}
                className={[
                  'border-b border-[var(--border-default)] hover:bg-[var(--accent-sand-glow)] transition-colors cursor-pointer',
                  i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface)]',
                ].join(' ')}
                onClick={() => tenantSlug && navigate(`/${tenantSlug}/projects/${project.id}`)}
              >
                <td className="px-4 py-3 text-[0.82rem] text-[var(--text-primary)] font-medium">
                  {project.name}
                </td>
                <td className="px-4 py-3">
                  <span className="text-mono text-[0.72rem]">{project.refCode}</span>
                </td>
                <td className="px-4 py-3 text-table-cell">{project.location}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={project.status}>
                    {project.status === 'active'
                      ? 'On Track'
                      : project.status === 'review'
                        ? 'At Risk'
                        : project.status === 'danger'
                          ? 'Delayed'
                          : 'Complete'}
                  </StatusBadge>
                </td>
                <td
                  className="px-4 py-3 text-financial text-[0.78rem]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {formatRands(project.engineerCost)}
                </td>
                <td
                  className="px-4 py-3 text-financial text-[0.78rem]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {formatRands(project.contractValue)}
                </td>
                <td
                  className="px-4 py-3 text-[0.78rem]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-muted)' }}
                >
                  {formatRands(project.expenditurePlan)}
                </td>
                <td
                  className="px-4 py-3 text-financial text-[0.78rem]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {formatRands(project.expenditureActual)}
                </td>
                <td className="px-4 py-3 text-[0.78rem] text-[var(--text-muted)]">
                  {project.progressProjected}%
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-[0.78rem] font-medium"
                    style={{
                      color:
                        project.progressActual >= project.progressProjected
                          ? 'var(--status-success)'
                          : project.progressActual >= project.progressProjected * 0.8
                            ? 'var(--status-warning)'
                            : 'var(--status-danger)',
                    }}
                  >
                    {project.progressActual}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
