import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import IDPTable from '@/components/ui/IDPTable';
import { idpApi } from '@/api/idp';
import { exportPdf, exportXlsx } from '@/utils/clientExports';
import { MOCK_IDP_PROJECTS } from '@/mocks/idpProjects';
import { formatRands } from '@/utils/formatters';

export default function IDPView() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['idp', 'projects', tenantSlug],
    queryFn: () => idpApi.list(),
  });

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    try {
      const blob = format === 'xlsx' ? await idpApi.exportXlsx() : await idpApi.exportPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IDP-Export.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      type Row = {
        idpProjectNo: string;
        name: string;
        localMunicipality: string;
        location: string;
        serviceCategory: string;
        status: string;
        currentStage: number;
        mtefYear1: number;
        mtefYear2: number;
        mtefYear3: number;
      };

      const rows: Row[] = (projects.length > 0 ? projects : MOCK_IDP_PROJECTS).map((p) => ({
        idpProjectNo: p.idpProjectNo ?? 'N/A',
        name: p.name ?? 'N/A',
        localMunicipality: p.localMunicipality ?? 'N/A',
        location: p.location ?? 'N/A',
        serviceCategory: p.serviceCategory ?? 'N/A',
        status: p.status ?? 'N/A',
        currentStage: p.currentStage ?? 0,
        mtefYear1: p.mtefYear1 ?? 0,
        mtefYear2: p.mtefYear2 ?? 0,
        mtefYear3: p.mtefYear3 ?? 0,
      }));

      const columns: {
        key: keyof Row;
        header: string;
        formatter?: (value: unknown, row: Row) => string;
      }[] = [
        { key: 'idpProjectNo', header: 'IDP No' },
        { key: 'name', header: 'Project Name' },
        { key: 'localMunicipality', header: 'Local Municipality' },
        { key: 'location', header: 'Location' },
        { key: 'serviceCategory', header: 'Service Category' },
        {
          key: 'currentStage',
          header: 'Current Stage',
          formatter: (v) => (Number(v) > 0 ? `Stage ${v}` : 'N/A'),
        },
        { key: 'status', header: 'Status' },
        {
          key: 'mtefYear1',
          header: 'MTEF Year 1',
          formatter: (v) => formatRands(Number(v)),
        },
        {
          key: 'mtefYear2',
          header: 'MTEF Year 2',
          formatter: (v) => formatRands(Number(v)),
        },
        {
          key: 'mtefYear3',
          header: 'MTEF Year 3',
          formatter: (v) => formatRands(Number(v)),
        },
      ];

      const filename = `IDP-Export.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
      if (format === 'xlsx') {
        await exportXlsx<Row>({ filename, sheetName: 'IDP', columns, rows });
      } else {
        exportPdf<Row>({
          filename,
          title: 'IDP view',
          subtitle: 'Projects by local municipality (current data)',
          columns,
          rows,
        });
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-h1 mb-2">IDP View</h1>
        <p className="text-body text-[var(--text-muted)]">
          Integrated Development Plan: projects grouped by local municipality.
        </p>
      </div>
      <IDPTable projects={projects} onExport={handleExport} isLoading={isLoading} />
    </div>
  );
}
