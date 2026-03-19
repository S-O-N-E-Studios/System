import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormData } from '@/types';
import { SERVICE_CATEGORY_LABELS } from '@/types';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { useUiStore } from '@/store/uiStore';
import { ArrowLeft } from 'lucide-react';

const LOCAL_MUNICIPALITIES = [
  'Victor Khanye',
  'Emalahleni',
  'Steve Tshwete',
  'Emakhazeni',
  'Thembisile Hani',
  'Dr JS Moroka',
];

export default function ProjectForm() {
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id?: string }>();
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      contractValue: 0,
      status: 'active',
      contractTypes: ['professional'],
      serviceCategory: undefined,
      localMunicipality: '',
      idpProjectNo: '',
    },
  });

  const onSubmit = async () => {
    // Will connect to API in Sprint 4
    addToast({ type: 'success', message: isEdit ? 'Project updated.' : 'Project created.' });
    navigate(`/${tenantSlug}/projects`);
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to={`/${tenantSlug}/projects`}
          className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-h1">{isEdit ? 'Edit Project' : 'New Project'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
          <h3 className="text-h3">Project Details</h3>

          <FormInput
            label="Project Name"
            placeholder="e.g. Polokwane Water Treatment Upgrade"
            error={errors.name?.message}
            {...register('name')}
          />

          {isEdit && (
            <FormInput label="Reference Code" value="PRJ-2026-001" disabled />
          )}

          <FormInput
            label="Contract Value (ZAR)"
            type="number"
            placeholder="0"
            error={errors.contractValue?.message}
            {...register('contractValue', { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-eyebrow text-[var(--text-muted)]">Status</label>
            <select
              className="w-full bg-transparent border-0 border-b border-[var(--border)] py-2 font-body text-[0.82rem] font-light text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-[border-color] duration-200"
              {...register('status')}
            >
              <option value="active" className="bg-[var(--bg-card)]">Active</option>
              <option value="on-hold" className="bg-[var(--bg-card)]">On Hold</option>
              <option value="complete" className="bg-[var(--bg-card)]">Complete</option>
              <option value="cancelled" className="bg-[var(--bg-card)]">Cancelled</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-eyebrow text-[var(--text-muted)]">Service Category</label>
            <select
              className="w-full bg-transparent border-0 border-b border-[var(--border)] py-2 font-body text-[0.82rem] font-light text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-[border-color] duration-200"
              {...register('serviceCategory')}
            >
              <option value="" className="bg-[var(--bg-card)]">Select category</option>
              {(Object.keys(SERVICE_CATEGORY_LABELS) as Array<keyof typeof SERVICE_CATEGORY_LABELS>).map((k) => (
                <option key={k} value={k} className="bg-[var(--bg-card)]">
                  {SERVICE_CATEGORY_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-eyebrow text-[var(--text-muted)]">Local Municipality</label>
            <select
              className="w-full bg-transparent border-0 border-b border-[var(--border)] py-2 font-body text-[0.82rem] font-light text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-[border-color] duration-200"
              {...register('localMunicipality')}
            >
              <option value="" className="bg-[var(--bg-card)]">Select municipality</option>
              {LOCAL_MUNICIPALITIES.map((m) => (
                <option key={m} value={m} className="bg-[var(--bg-card)]">
                  {m}
                </option>
              ))}
            </select>
          </div>

          <FormInput
            label="IDP Project No (optional)"
            placeholder="e.g. IDP-2026-001"
            error={errors.idpProjectNo?.message}
            {...register('idpProjectNo')}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="GPS Latitude"
              type="number"
              step="any"
              placeholder="-23.9045"
              error={errors.location?.lat?.message}
              {...register('location.lat', { valueAsNumber: true })}
            />
            <FormInput
              label="GPS Longitude"
              type="number"
              step="any"
              placeholder="29.4688"
              error={errors.location?.lng?.message}
              {...register('location.lng', { valueAsNumber: true })}
            />
          </div>

          <FormInput
            label="Geo-Tec Engineer"
            placeholder="Firm name (optional)"
            {...register('geoTecEngineer')}
          />
        </div>

        {/* File upload placeholder */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
          <h3 className="text-h3 mb-4">Attachments</h3>
          <div className="border-2 border-dashed border-[var(--border-strong)] p-8 flex items-center justify-center">
            <p className="text-[var(--text-muted)] text-sm">
              File upload will be implemented in Sprint 3.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
