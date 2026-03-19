import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Download, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatRands } from '@/utils/formatters';
import {
  type IDPProjectRow,
  type FundingSourceType,
  type ProjectStage,
  type ServiceCategory,
  FUNDER_TYPE_LABELS,
  SERVICE_CATEGORY_LABELS,
} from '@/types';

const LOCAL_MUNICIPALITIES = [
  'Victor Khanye',
  'Emalahleni',
  'Steve Tshwete',
  'Emakhazeni',
  'Thembisile Hani',
  'Dr JS Moroka',
];

interface IDPTableProps {
  projects: IDPProjectRow[];
  onExport?: (format: 'xlsx' | 'pdf') => void;
  isLoading?: boolean;
}

export default function IDPTable({ projects, onExport, isLoading }: IDPTableProps) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(LOCAL_MUNICIPALITIES));
  const [funderFilter, setFunderFilter] = useState<FundingSourceType | ''>('');
  const [serviceFilter, setServiceFilter] = useState<ServiceCategory | ''>('');
  const [stageFilter, setStageFilter] = useState<ProjectStage | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const toggleGroup = (muni: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(muni)) next.delete(muni);
      else next.add(muni);
      return next;
    });
  };

  const grouped: Record<string, IDPProjectRow[]> = LOCAL_MUNICIPALITIES.reduce<Record<string, IDPProjectRow[]>>(
    (acc, muni) => {
      acc[muni] = projects.filter((p) => (p.localMunicipality || 'Unassigned') === muni);
      return acc;
    },
    {} as Record<string, IDPProjectRow[]>
  );

  // Add unassigned
  const unassigned = projects.filter((p) => !p.localMunicipality || !LOCAL_MUNICIPALITIES.includes(p.localMunicipality));
  if (unassigned.length > 0) {
    grouped['Unassigned'] = unassigned;
  }

  const filteredGrouped = Object.entries(grouped).reduce<Record<string, IDPProjectRow[]>>(
    (acc, [muni, rows]) => {
      let filtered: IDPProjectRow[] = rows;
      if (funderFilter) filtered = filtered.filter((p) => p.funderType === funderFilter);
      if (serviceFilter) filtered = filtered.filter((p) => p.serviceCategory === serviceFilter);
      if (stageFilter) filtered = filtered.filter((p) => p.currentStage === stageFilter);
      if (statusFilter) filtered = filtered.filter((p) => p.status === statusFilter);
      if (filtered.length > 0) acc[muni] = filtered;
      return acc;
    },
    {} as Record<string, IDPProjectRow[]>
  );

  const columns = [
    'IDP Project No',
    'Project Name',
    'Description',
    'Location',
    'MTEF Y1',
    'MTEF Y2',
    'MTEF Y3',
    'Funder',
    'Stage',
    'Status',
  ];

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-12">
        <div className="skeleton h-6 w-48 mb-6" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--text-muted)]" />
          <select
            value={funderFilter}
            onChange={(e) => setFunderFilter(e.target.value as FundingSourceType | '')}
            className="bg-transparent border border-[var(--border-default)] px-3 py-1.5 text-[0.82rem] text-[var(--text-primary)]"
          >
            <option value="">All Funders</option>
            {(Object.keys(FUNDER_TYPE_LABELS) as FundingSourceType[]).map((k) => (
              <option key={k} value={k}>
                {FUNDER_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value as ServiceCategory | '')}
          className="bg-transparent border border-[var(--border-default)] px-3 py-1.5 text-[0.82rem] text-[var(--text-primary)] min-w-[180px]"
        >
          <option value="">All Categories</option>
          {(Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategory[]).map((k) => (
            <option key={k} value={k}>{SERVICE_CATEGORY_LABELS[k]}</option>
          ))}
        </select>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter((e.target.value ? Number(e.target.value) : '') as ProjectStage | '')}
          className="bg-transparent border border-[var(--border-default)] px-3 py-1.5 text-[0.82rem] text-[var(--text-primary)]"
        >
          <option value="">All Stages</option>
          {([1, 2, 3, 4, 5, 6] as ProjectStage[]).map((s) => (
            <option key={s} value={s}>
              Stage {s}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-transparent border border-[var(--border-default)] px-3 py-1.5 text-[0.82rem] text-[var(--text-primary)]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="complete">Complete</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => onExport?.('xlsx')}>
            <Download className="h-3.5 w-3.5" />
            Export XLSX
          </Button>
          <Button variant="secondary" onClick={() => onExport?.('pdf')}>
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              <th className="w-8 text-table-header text-left px-4 py-3" />
              {columns.map((h) => (
                <th key={h} className="text-table-header text-left px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(filteredGrouped).map(([muni, rows]) => (
              <React.Fragment key={muni}>
                <tr
                  className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-default)] cursor-pointer hover:bg-[var(--accent-sand-glow)]"
                  onClick={() => toggleGroup(muni)}
                >
                  <td className="px-4 py-3">
                    {expandedGroups.has(muni) ? (
                      <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                    )}
                  </td>
                  <td colSpan={columns.length} className="px-4 py-3">
                    <span className="text-[0.82rem] font-semibold text-[var(--text-primary)]">
                      {muni}
                    </span>
                    <span className="text-[0.68rem] text-[var(--text-muted)] ml-2">
                      ({rows.length} project{rows.length !== 1 ? 's' : ''})
                    </span>
                  </td>
                </tr>
                {expandedGroups.has(muni) &&
                  rows.map((p, i) => (
                    <tr
                      key={p.id}
                      className={[
                        'border-b border-[var(--border-default)] hover:bg-[var(--accent-sand-glow)] transition-colors',
                        i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface)]',
                      ].join(' ')}
                    >
                      <td className="px-4 py-2" />
                      <td className="px-4 py-2 text-mono text-[0.78rem]">
                        {p.idpProjectNo || 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/${tenantSlug}/projects/${p.id}`}
                          className="text-[0.82rem] font-medium text-[var(--accent-periwinkle)] hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-[0.78rem] text-[var(--text-primary)] max-w-[200px] truncate">
                        {p.description || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-[0.78rem] text-[var(--text-muted)]">
                        {p.location || p.localMunicipality || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-financial text-[0.78rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {p.mtefYear1 != null ? formatRands(p.mtefYear1) : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-financial text-[0.78rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {p.mtefYear2 != null ? formatRands(p.mtefYear2) : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-financial text-[0.78rem]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {p.mtefYear3 != null ? formatRands(p.mtefYear3) : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-[0.78rem]">
                        {p.funderType ? FUNDER_TYPE_LABELS[p.funderType] : p.funder || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-[0.78rem]">
                        {p.currentStage != null ? `Stage ${p.currentStage}` : 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={p.status === 'active' ? 'active' : p.status === 'complete' ? 'done' : 'planning'}>
                          {p.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
