import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormData } from '@/types';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { useUiStore } from '@/store/uiStore';
import { ArrowLeft } from 'lucide-react';

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
      status: 'not_started',
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
              <option value="not_started" className="bg-[var(--bg-card)]">Not Started</option>
              <option value="active" className="bg-[var(--bg-card)]">Active</option>
              <option value="in_review" className="bg-[var(--bg-card)]">In Review</option>
              <option value="complete" className="bg-[var(--bg-card)]">Complete</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="GPS Latitude"
              type="number"
              step="any"
              placeholder="-23.9045"
              error={errors.gpsLatitude?.message}
              {...register('gpsLatitude', { valueAsNumber: true })}
            />
            <FormInput
              label="GPS Longitude"
              type="number"
              step="any"
              placeholder="29.4688"
              error={errors.gpsLongitude?.message}
              {...register('gpsLongitude', { valueAsNumber: true })}
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
