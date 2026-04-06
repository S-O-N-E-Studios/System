import { useState, useEffect } from 'react';
import ServiceCategoryCard from '@/components/ui/ServiceCategoryCard';
import Button from '@/components/ui/Button';
import { servicesApi } from '@/api/services';
import { Download } from 'lucide-react';
import {
  type ServiceCategorySummary,
  type ServiceCategory,
  type Project,
} from '@/types';

const CATEGORIES: ServiceCategory[] = [
  'water_sanitation',
  'energy_electricity',
  'roads_stormwater',
  'waste_management',
  'recreational_sport_libraries',
  'public_transportation',
];

/* Mock data for frontend-only development */
function getMockSummaries(): ServiceCategorySummary[] {
  const mockProjects: Project[] = [
    {
      id: '1',
      tenantId: 't1',
      name: 'R573 Road Rehabilitation',
      refCode: 'PRJ-2026-001',
      status: 'active',
      currentStage: 4,
      serviceCategory: 'roads_stormwater',
      localMunicipality: 'Emalahleni',
      contractValue: 45_000_000,
      expenditureToDate: 18_200_000,
      balance: 26_800_000,
      contractTypes: ['professional', 'construction'],
      createdAt: '2026-01-01',
      updatedAt: '2026-03-01',
    },
    {
      id: '2',
      tenantId: 't1',
      name: 'Mokopane Water Treatment',
      refCode: 'PRJ-2026-002',
      status: 'active',
      currentStage: 3,
      serviceCategory: 'water_sanitation',
      localMunicipality: 'Steve Tshwete',
      contractValue: 55_000_000,
      expenditureToDate: 12_000_000,
      balance: 43_000_000,
      contractTypes: ['professional', 'geotechnical'],
      createdAt: '2026-01-15',
      updatedAt: '2026-02-28',
    },
    {
      id: '3',
      tenantId: 't1',
      name: 'Victor Khanye Community Hall',
      refCode: 'PRJ-2026-003',
      status: 'active',
      currentStage: 5,
      serviceCategory: 'recreational_sport_libraries',
      localMunicipality: 'Victor Khanye',
      contractValue: 8_000_000,
      expenditureToDate: 5_200_000,
      balance: 2_800_000,
      contractTypes: ['construction'],
      createdAt: '2025-11-01',
      updatedAt: '2026-03-10',
    },
    {
      id: '4',
      tenantId: 't1',
      name: 'Emakhazeni Waste Transfer Station',
      refCode: 'PRJ-2025-012',
      status: 'complete',
      currentStage: 6,
      serviceCategory: 'waste_management',
      localMunicipality: 'Emakhazeni',
      contractValue: 8_000_000,
      expenditureToDate: 8_000_000,
      balance: 0,
      contractTypes: ['professional', 'construction'],
      createdAt: '2025-06-01',
      updatedAt: '2026-01-15',
    },
  ];

  return CATEGORIES.map((category) => {
    const projects = mockProjects.filter((p) => p.serviceCategory === category);
    return {
      category,
      projectCount: projects.length,
      totalBudget: projects.reduce((s, p) => s + p.contractValue, 0),
      totalExpenditure: projects.reduce((s, p) => s + p.expenditureToDate, 0),
      projects,
    };
  });
}

export default function NormalServices() {
  const [summaries, setSummaries] = useState<ServiceCategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const data = await servicesApi.summary();
        if (!cancelled) setSummaries(data);
      } catch {
        if (!cancelled) setSummaries(getMockSummaries());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

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
      // Export requires backend when available
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
