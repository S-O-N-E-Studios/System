import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ServiceCategoryCard from '@/components/ui/ServiceCategoryCard';
import Button from '@/components/ui/Button';
import { servicesApi } from '@/api/services';
import { Download } from 'lucide-react';
import { exportPdf, exportXlsx } from '@/utils/clientExports';
import type { Project, ServiceCategory } from '@/types';
import { getMockServiceSummaries } from '@/mocks/normalServiceSummaries';
import { formatRands } from '@/utils/formatters';

export default function NormalServices() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['services', 'summary', tenantSlug],
    queryFn: async () => {
      try {
        return await servicesApi.summary();
      } catch {
        return getMockServiceSummaries();
      }
    },
  });

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    try {
      const blob = format === 'xlsx' ? await servicesApi.exportXlsx() : await servicesApi.exportPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Normal-Services.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      type Row = {
        category: ServiceCategory;
        projectName: string;
        localMunicipality: string;
        budget: number;
        stage: string;
        status: Project['status'];
      };

      const rows: Row[] = summaries.flatMap((s) =>
        s.projects.map((p) => ({
          category: s.category,
          projectName: p.name,
          localMunicipality: p.localMunicipality ?? 'N/A',
          budget: p.contractValue,
          stage: p.currentStage != null ? `Stage ${p.currentStage}` : 'N/A',
          status: p.status,
        })),
      );

      const columns: {
        key: keyof Row;
        header: string;
        formatter?: (value: unknown, row: Row) => string;
      }[] = [
        { key: 'category', header: 'Service Category' },
        { key: 'projectName', header: 'Project' },
        { key: 'localMunicipality', header: 'Local Municipality' },
        {
          key: 'budget',
          header: 'Budget',
          formatter: (v) => formatRands(Number(v)),
        },
        { key: 'stage', header: 'Stage' },
        {
          key: 'status',
          header: 'Status',
          formatter: (v) =>
            v === 'active'
              ? 'Active'
              : v === 'review'
                ? 'In Review'
                : v === 'planning'
                  ? 'Not Started'
                  : 'Complete',
        },
      ];

      const filename = `Normal-Services.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
      if (format === 'xlsx') {
        await exportXlsx<Row>({ filename, sheetName: 'Normal Services', columns, rows });
      } else {
        exportPdf<Row>({
          filename,
          title: 'Normal Services',
          subtitle: 'Projects by service category (current view)',
          columns,
          rows,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 mb-2">Normal Services</h1>
          <p className="text-body text-[var(--text-muted)]">
            Projects grouped by service category: Water, Roads, Energy, Waste, Recreational, Transport.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={() => handleExport('xlsx')}>
            <Download className="h-3.5 w-3.5" />
            Export XLSX
          </Button>
          <Button variant="secondary" onClick={() => handleExport('pdf')}>
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaries.map((s) => (
          <ServiceCategoryCard
            key={s.category}
            category={s.category}
            projectCount={s.projectCount}
            totalBudget={s.totalBudget}
            totalExpenditure={s.totalExpenditure}
            projects={s.projects}
          />
        ))}
      </div>
    </div>
  );
}
