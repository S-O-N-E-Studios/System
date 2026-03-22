import { useState, useEffect } from 'react';
import IDPTable from '@/components/ui/IDPTable';
import { idpApi } from '@/api/idp';
import type { IDPProjectRow } from '@/types';

/* Mock data for frontend-only development */
const MOCK_IDP_PROJECTS: IDPProjectRow[] = [
  {
    id: '1',
    idpProjectNo: 'IDP-2026-001',
    name: 'R573 Road Rehabilitation',
    description: 'Road rehabilitation and stormwater upgrades',
    location: 'Mbombela, R573',
    localMunicipality: 'Emalahleni',
    mtefYear1: 15_000_000,
    mtefYear2: 18_000_000,
    mtefYear3: 12_000_000,
    funderType: 'mig',
    serviceCategory: 'roads_stormwater',
    currentStage: 4,
    status: 'active',
  },
  {
    id: '2',
    idpProjectNo: 'IDP-2026-002',
    name: 'Mokopane Water Treatment Upgrade',
    description: 'Bulk water supply and reticulation',
    location: 'Mokopane',
    localMunicipality: 'Steve Tshwete',
    mtefYear1: 22_000_000,
    mtefYear2: 25_000_000,
    mtefYear3: 8_000_000,
    funderType: 'rbig',
    serviceCategory: 'water_sanitation',
    currentStage: 3,
    status: 'active',
  },
  {
    id: '3',
    idpProjectNo: 'IDP-2026-003',
    name: 'Victor Khanye Community Hall',
    description: 'Recreational facility construction',
    location: 'Delmas',
    localMunicipality: 'Victor Khanye',
    mtefYear1: 5_000_000,
    mtefYear2: 3_000_000,
    mtefYear3: 0,
    funderType: 'equitable_share',
    serviceCategory: 'recreational_sport_libraries',
    currentStage: 5,
    status: 'active',
  },
  {
    id: '4',
    idpProjectNo: 'IDP-2025-012',
    name: 'Emakhazeni Waste Transfer Station',
    description: 'Solid waste transfer facility',
    location: 'Belfast',
    localMunicipality: 'Emakhazeni',
    mtefYear1: 8_000_000,
    mtefYear2: 0,
    mtefYear3: 0,
    funderType: 'mig',
    serviceCategory: 'waste_management',
    currentStage: 6,
    status: 'complete',
  },
];

export default function IDPView() {
  const [projects, setProjects] = useState<IDPProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const data = await idpApi.list();
        if (!cancelled) setProjects(data);
      } catch {
        if (!cancelled) setProjects(MOCK_IDP_PROJECTS);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

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
      // Mock: create placeholder download when backend is not available
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
