import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProjectStore } from '@/store/projectStore';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import type { ProjectTab } from '@/types';
import { Plus, Search, Filter, Download, ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { formatRands } from '@/utils/formatters';

const tabs: { key: ProjectTab; label: string }[] = [
  { key: 'ps', label: 'Professional Services' },
  { key: 'geo', label: 'Geo-Technical' },
  { key: 'cm', label: 'Construction Management' },
];

// Placeholder data
const mockProjects = [
  {
    id: '1', name: 'Polokwane Water Treatment Upgrade', ref: 'PRJ-2026-001',
    gps: '-23.9045, 29.4688', contractValue: 45000000, expenditure: 18200000,
    balance: 26800000, status: 'active' as const, attachments: 12,
    geoTecEngineer: 'Geoscience Ltd', geoTecReport: 'submitted', ddrStatus: 'complete',
    challenges: 'Groundwater contamination at borehole BH-3', recommendation: 'Re-route foundation to avoid contaminated zone',
    contractor: 'BuildCorp SA', startDate: '15 Jan 2026', completionDate: '30 Nov 2026',
    percentComplete: 42, constructionStatus: 'on_track',
  },
  {
    id: '2', name: 'Mokopane Road Rehabilitation', ref: 'PRJ-2026-002',
    gps: '-24.1868, 29.0148', contractValue: 32000000, expenditure: 14500000,
    balance: 17500000, status: 'review' as const, attachments: 8,
    geoTecEngineer: 'Terra Investigations', geoTecReport: 'in_review', ddrStatus: 'in_review',
    challenges: 'Expansive clay subsoils along section km 4-7', recommendation: 'Lime stabilisation required',
    contractor: 'RoadWorks Inc', startDate: '01 Mar 2026', completionDate: '28 Feb 2027',
    percentComplete: 28, constructionStatus: 'at_risk',
  },
  {
    id: '3', name: 'Tzaneen Bridge Construction', ref: 'PRJ-2026-003',
    gps: '-23.8318, 30.1636', contractValue: 78000000, expenditure: 5200000,
    balance: 72800000, status: 'planning' as const, attachments: 3,
    geoTecEngineer: '', geoTecReport: 'not_started', ddrStatus: 'pending',
    challenges: '', recommendation: '',
    contractor: '', startDate: '01 Jun 2026', completionDate: '31 Dec 2027',
    percentComplete: 5, constructionStatus: 'delayed',
  },
];

export default function Projects() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { activeTab, setActiveTab } = useProjectStore();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDrillDown = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const filteredProjects = useMemo(
    () =>
      mockProjects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ),
    [searchQuery]
  );

  const showEmpty = filteredProjects.length === 0;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Projects</h1>
        <Link to={`/${tenantSlug}/projects/new`}>
          <Button variant="primary">
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Tab row */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-6">
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
      <div className="flex items-center gap-4 mb-6 sticky top-16 z-10 bg-[var(--bg-primary)] py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[var(--border)] pl-6 pr-4 py-1.5 font-body text-[0.82rem] font-light text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-[border-color] duration-200"
          />
        </div>
        <Button variant="secondary" className="!min-w-0 !px-4">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </Button>
        <Button variant="secondary" className="!min-w-0 !px-4">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Professional Services Table */}
      {activeTab === 'ps' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] overflow-x-auto min-w-full">
          {showEmpty ? (
            <EmptyState
              title={searchQuery.trim() ? 'No projects match your search.' : 'No projects yet.'}
              description={searchQuery.trim() ? 'Try a different search term.' : 'Create your first project to get started.'}
            />
          ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                {['Project Name', 'Ref', 'GPS', 'Contract Value', 'Expenditure', 'Balance', 'Status', ''].map((h) => (
                  <th key={h} className="text-table-header text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, i) => (
                <>
                  <tr
                    key={p.id}
                    className={[
                      'group border-b border-[var(--border)] cursor-pointer transition-all duration-300',
                      'hover:bg-[var(--accent-glow)] hover:border-l-2 hover:border-l-[var(--accent)]',
                      i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-card)]',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/${tenantSlug}/projects/${p.id}`}
                        className="text-[0.82rem] font-body font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-mono">{p.ref}</td>
                    <td className="px-4 py-3">
                      <button className="text-mono !text-[var(--status-planning)] cursor-pointer hover:underline">
                        {p.gps}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-currency">{formatRands(p.contractValue)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleDrillDown(p.id)}
                        className="flex items-center gap-1 text-currency cursor-pointer"
                      >
                        {formatRands(p.expenditure)}
                        {expandedRow === p.id
                          ? <ChevronUp className="h-3 w-3 text-[var(--accent)]" />
                          : <ChevronDown className="h-3 w-3 text-[var(--accent)]" />
                        }
                      </button>
                    </td>
                    <td className={`px-4 py-3 text-currency ${p.balance >= 0 ? '!text-[var(--status-active)]' : '!text-[var(--status-danger)]'}`}>
                      {formatRands(p.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status}>
                        {p.status === 'active' ? 'Active' : p.status === 'review' ? 'In Review' : p.status === 'planning' ? 'Not Started' : 'Complete'}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
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
                      <td colSpan={8} className="px-4 py-4 bg-[rgba(201,169,97,0.04)] border-t border-[var(--accent)]">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                </>
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
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                {['Project Name', 'Geo-Tec Engineer', 'Project Value', 'Geo-Tec Report', 'Expenditure', 'Challenges', 'Recommendation', 'DDR Status'].map((h) => (
                  <th key={h} className="text-table-header text-left px-4 py-3 whitespace-nowrap">{h}</th>
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
                  <td className="px-4 py-3 text-[0.82rem] font-body font-medium text-[var(--text-primary)]">{p.name}</td>
                  <td className="px-4 py-3 text-table-cell">
                    {p.geoTecEngineer || <span className="italic text-[var(--text-muted)]">Not Appointed</span>}
                  </td>
                  <td className="px-4 py-3 text-currency">{formatRands(p.contractValue)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.geoTecReport === 'submitted' ? 'active' : p.geoTecReport === 'in_review' ? 'review' : 'planning'}>
                      {p.geoTecReport === 'submitted' ? 'Submitted' : p.geoTecReport === 'in_review' ? 'In Review' : 'Pending'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-currency">{formatRands(p.expenditure)}</td>
                  <td className="px-4 py-3 text-table-cell max-w-[200px] truncate">{p.challenges || '—'}</td>
                  <td className="px-4 py-3 text-table-cell max-w-[200px] truncate">{p.recommendation || '—'}</td>
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
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--table-header-bg)' }}>
                {['Project Name', 'Contractor', 'Contract Value', 'Start Date', 'Completion Date', 'Expenditure', '% Complete', 'Status'].map((h) => (
                  <th key={h} className="text-table-header text-left px-4 py-3 whitespace-nowrap">{h}</th>
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
                  <td className="px-4 py-3 text-[0.82rem] font-body font-medium text-[var(--text-primary)]">{p.name}</td>
                  <td className="px-4 py-3 text-table-cell">
                    {p.contractor || <span className="italic text-[var(--text-muted)]">Not Appointed</span>}
                  </td>
                  <td className="px-4 py-3 text-currency">{formatRands(p.contractValue)}</td>
                  <td className="px-4 py-3 text-table-cell text-[var(--text-muted)]">{p.startDate}</td>
                  <td className="px-4 py-3 text-table-cell">{p.completionDate}</td>
                  <td className="px-4 py-3 text-currency">{formatRands(p.expenditure)}</td>
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
    </div>
  );
}
