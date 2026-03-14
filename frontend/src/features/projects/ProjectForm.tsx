import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { useUiStore } from '@/store/uiStore';
import { useCreateProject, useUpdateProject, useProject } from '@/hooks/useProjects';
import { filesApi } from '@/api/files';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';

const projectFormSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(200),
  contractValue: z.number().positive('Contract value must be positive'),
  status: z.string().min(1, 'Status is required'),
  gpsLatitude: z.number().min(-90).max(90).optional().nullable(),
  gpsLongitude: z.number().min(-180).max(180).optional().nullable(),
  geoTecEngineer: z.string().optional(),
  contractor: z.string().optional(),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  description: z.string().optional(),
  mtefYear1: z.number().min(0).optional(),
  mtefYear2: z.number().min(0).optional(),
  mtefYear3: z.number().min(0).optional(),
});

type FormData = z.infer<typeof projectFormSchema>;

export default function ProjectForm() {
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id?: string }>();
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const isEdit = Boolean(id);
  const { data: existingProject } = useProject(isEdit ? id : undefined);

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(id ?? '');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: existingProject?.name ?? '',
      contractValue: existingProject?.contractValue ?? 0,
      status: existingProject?.status ?? 'not_started',
      gpsLatitude: existingProject?.gpsLatitude ?? undefined,
      gpsLongitude: existingProject?.gpsLongitude ?? undefined,
      geoTecEngineer: existingProject?.geoTecEngineer ?? '',
      contractor: existingProject?.contractor ?? '',
      startDate: existingProject?.startDate?.split('T')[0] ?? '',
      completionDate: existingProject?.completionDate?.split('T')[0] ?? '',
      description: existingProject?.description ?? '',
      mtefYear1: existingProject?.mtef?.year1Budget ?? 0,
      mtefYear2: existingProject?.mtef?.year2Budget ?? 0,
      mtefYear3: existingProject?.mtef?.year3Budget ?? 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        contractValue: data.contractValue,
        status: data.status,
        gpsLatitude: data.gpsLatitude || undefined,
        gpsLongitude: data.gpsLongitude || undefined,
        geoTecEngineer: data.geoTecEngineer || undefined,
        contractor: data.contractor || undefined,
        startDate: data.startDate || undefined,
        completionDate: data.completionDate || undefined,
        description: data.description || undefined,
        mtef: {
          year1Budget: data.mtefYear1 || 0,
          year2Budget: data.mtefYear2 || 0,
          year3Budget: data.mtefYear3 || 0,
        },
      };

      let projectId = id;
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        addToast({ type: 'success', message: 'Project updated.' });
      } else {
        const created = await createMutation.mutateAsync(payload);
        projectId = created.id;
        addToast({ type: 'success', message: 'Project created.' });
      }

      if (uploadedFiles.length > 0 && projectId) {
        for (const file of uploadedFiles) {
          await filesApi.upload(file, projectId);
        }
      }

      navigate(`/${tenantSlug}/projects`);
    } catch {
      addToast({ type: 'error', message: 'Failed to save project. Please try again.' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter((f) => f.size <= 50 * 1024 * 1024);
    setUploadedFiles((prev) => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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

          <div>
            <label className="text-eyebrow block mb-2">Description</label>
            <textarea
              placeholder="Brief project description (optional)"
              rows={3}
              className="w-full bg-transparent border-0 border-b border-[var(--border)] py-2 font-body text-[0.82rem] font-light text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none resize-none"
              {...register('description')}
            />
          </div>

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
              className="w-full bg-transparent border-0 border-b border-[var(--border)] py-2 font-body text-[0.82rem] font-light text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
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
              label="Start Date"
              type="date"
              {...register('startDate')}
            />
            <FormInput
              label="Completion Date"
              type="date"
              {...register('completionDate')}
            />
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

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Geo-Tec Engineer"
              placeholder="Firm name (optional)"
              {...register('geoTecEngineer')}
            />
            <FormInput
              label="Contractor"
              placeholder="Contractor name (optional)"
              {...register('contractor')}
            />
          </div>
        </div>

        {/* MTEF Budget Section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
          <h3 className="text-h3">MTEF Budget Allocation</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="Year 1 (ZAR)"
              type="number"
              placeholder="0"
              {...register('mtefYear1', { valueAsNumber: true })}
            />
            <FormInput
              label="Year 2 (ZAR)"
              type="number"
              placeholder="0"
              {...register('mtefYear2', { valueAsNumber: true })}
            />
            <FormInput
              label="Year 3 (ZAR)"
              type="number"
              placeholder="0"
              {...register('mtefYear3', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8">
          <h3 className="text-h3 mb-4">Attachments</h3>
          <label className="block cursor-pointer">
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.dwg"
            />
            <div className="border-2 border-dashed border-[var(--border-strong)] p-8 flex flex-col items-center justify-center hover:border-[var(--accent)] transition-colors">
              <Upload className="h-8 w-8 text-[var(--accent-dim)] mb-3" />
              <p className="text-[0.82rem] text-[var(--text-secondary)]">Click to upload files</p>
              <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">PDF, DOCX, XLSX, Images — Max 50MB per file</p>
            </div>
          </label>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--accent-dim)]" />
                    <span className="text-[0.78rem] text-[var(--text-primary)]">{file.name}</span>
                    <span className="text-[0.6rem] text-[var(--text-muted)]">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-[var(--text-muted)] hover:text-[var(--status-danger)]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
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
