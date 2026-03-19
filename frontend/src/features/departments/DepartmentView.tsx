import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatRands } from '@/utils/formatters';
import StatusBadge from '@/components/ui/StatusBadge';

/* Mock data; will be replaced with React Query + API */
const DEPT_DATA: Record<string, {
  name: string;
  fullName: string;
  programs: { name: string; budget: number; spent: number }[];
  projects: {
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
  }[];
}> = {
  dpw: {
    name: 'DPW',
    fullName: 'Department of Public Works',
    programs: [
      { name: 'Road Maintenance', budget: 1_000_000_000, spent: 420_000_000 },
      { name: 'Capital Projects', budget: 2_500_000_000, spent: 1_100_000_000 },
      { name: 'Public Facilities', budget: 1_000_000_000, spent: 350_000_000 },
      { name: 'Patchwork', budget: 500_000_000, spent: 230_000_000 },
    ],
    projects: [
      { id: '1', name: 'R573 Road Rehabilitation', refCode: 'PRJ-2026-001', location: 'Mbombela', status: 'active', engineerCost: 4_500_000, contractValue: 45_000_000, expenditurePlan: 18_000_000, expenditureActual: 15_200_000, progressProjected: 45, progressActual: 38 },
      { id: '2', name: 'N4 Bridge Widening', refCode: 'PRJ-2026-002', location: 'Nelspruit', status: 'active', engineerCost: 2_800_000, contractValue: 32_000_000, expenditurePlan: 12_000_000, expenditureActual: 11_800_000, progressProjected: 35, progressActual: 34 },
      { id: '3', name: 'Barberton Access Road', refCode: 'PRJ-2026-003', location: 'Barberton', status: 'review', engineerCost: 1_200_000, contractValue: 18_500_000, expenditurePlan: 8_000_000, expenditureActual: 9_200_000, progressProjected: 60, progressActual: 52 },
      { id: '4', name: 'White River Stormwater', refCode: 'PRJ-2025-018', location: 'White River', status: 'danger', engineerCost: 900_000, contractValue: 12_000_000, expenditurePlan: 10_000_000, expenditureActual: 11_500_000, progressProjected: 85, progressActual: 65 },
      { id: '5', name: 'Hazyview Community Hall', refCode: 'PRJ-2025-012', location: 'Hazyview', status: 'done', engineerCost: 600_000, contractValue: 8_000_000, expenditurePlan: 8_000_000, expenditureActual: 7_800_000, progressProjected: 100, progressActual: 100 },
    ],
  },
};

const DEFAULT_DEPT = DEPT_DATA.dpw;

function formatBudgetLabel(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  return `${amount}`;
}

export default function DepartmentView() {
  const { tenantSlug, deptId } = useParams<{ tenantSlug: string; deptId: string }>();
  const navigate = useNavigate();
  const dept = (deptId && DEPT_DATA[deptId]) || DEFAULT_DEPT;
  const maxProgramBudget = Math.max(...dept.programs.map((p) => p.budget));

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
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatBudgetLabel(prog.budget)}
                </span>
                <div className="w-full max-w-[90px] relative" style={{ height: '180px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[var(--accent-sand)]"
                    style={{
                      height: `${barHeight}%`,
                      animation: `barGrow 0.8s ease-out ${i * 0.12}s both`,
                      transformOrigin: 'bottom',
                    }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[var(--status-warning)] opacity-60"
                      style={{ height: `${(prog.spent / prog.budget) * 100}%` }}
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
                    {project.status === 'active' ? 'On Track' :
                     project.status === 'review' ? 'At Risk' :
                     project.status === 'danger' ? 'Delayed' : 'Complete'}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 text-financial text-[0.78rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatRands(project.engineerCost)}
                </td>
                <td className="px-4 py-3 text-financial text-[0.78rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatRands(project.contractValue)}
                </td>
                <td className="px-4 py-3 text-[0.78rem]" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                  {formatRands(project.expenditurePlan)}
                </td>
                <td className="px-4 py-3 text-financial text-[0.78rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatRands(project.expenditureActual)}
                </td>
                <td className="px-4 py-3 text-[0.78rem] text-[var(--text-muted)]">
                  {project.progressProjected}%
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-[0.78rem] font-medium"
                    style={{
                      color: project.progressActual >= project.progressProjected
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
