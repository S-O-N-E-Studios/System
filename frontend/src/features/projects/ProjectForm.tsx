import { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectFormData } from '@/types';
import { SERVICE_CATEGORY_LABELS } from '@/types';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { useUiStore } from '@/store/uiStore';
import { ArrowLeft, Upload, X as XIcon, FileText } from 'lucide-react';

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

  // Document upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([]);

  // Date fields (appointment + completion)
  const [appointmentDate, setAppointmentDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');

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

          {/* Address — primary location field */}
          <FormInput
            label="Project Address"
            placeholder="e.g. R573 Road, Emalahleni, Mpumalanga, South Africa"
            error={errors.location?.address?.message}
            {...register('location.address')}
          />

          {/* GPS coordinates — secondary / optional */}
          <details className="group">
            <summary className="text-eyebrow text-[var(--text-muted)] cursor-pointer hover:text-[var(--accent)] transition-colors select-none py-1 flex items-center gap-2">
              <span className="group-open:rotate-90 transition-transform inline-block text-[0.65rem]">▶</span>
              GPS Coordinates (optional — derived from address by backend)
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pl-4 border-l-2 border-[var(--border)]">
              <FormInput
                label="Latitude"
                type="number"
                step="any"
                placeholder="-23.9045"
                error={errors.location?.lat?.message}
                {...register('location.lat', { valueAsNumber: true })}
              />
              <FormInput
                label="Longitude"
                type="number"
                step="any"
                placeholder="29.4688"
                error={errors.location?.lng?.message}
                {...register('location.lng', { valueAsNumber: true })}
              />
            </div>
          </details>

          <FormInput
            label="Geo-Tec Engineer"
            placeholder="Firm name (optional)"
            {...register('geoTecEngineer')}
          />
        </div>

        {/* Dates section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
          <h3 className="text-h3">Project Dates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatePicker
              label="Appointment Date"
              type="date"
              value={appointmentDate}
              onChange={setAppointmentDate}
              max={completionDate || undefined}
            />
            <DatePicker
              label="Target Completion"
              type="date"
              value={completionDate}
              onChange={setCompletionDate}
              min={appointmentDate || undefined}
            />
          </div>
        </div>

        {/* Document upload */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
          <h3 className="text-h3">Initial Documents</h3>
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            Attach scoping reports, quotations, or appointment letters for Stage 1. Additional stage documents are uploaded from the Project Detail view.
          </p>

          {/* Drop zone */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.docx,.dwg,.png,.jpg,.jpeg"
            className="sr-only"
            aria-label="Select initial project documents"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setUploadedDocs((prev) => [...prev, ...files]);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-[var(--border-strong)] p-8 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent)] transition-colors cursor-pointer bg-transparent text-left"
          >
            <Upload className="h-7 w-7 text-[var(--accent-dim)]" />
            <p className="text-body">Click to attach documents</p>
            <p className="text-[0.65rem] text-[var(--text-muted)]">PDF, XLSX, DOCX, DWG, PNG, JPG · Max 50 MB each</p>
          </button>

          {/* Attached file list */}
          {uploadedDocs.length > 0 && (
            <ul className="space-y-2">
              {uploadedDocs.map((file, idx) => (
                <li key={idx} className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <FileText className="h-4 w-4 text-[var(--accent-dim)] shrink-0" />
                  <span className="flex-1 text-[0.78rem] text-[var(--text-primary)] truncate">{file.name}</span>
                  <span className="text-[0.65rem] text-[var(--text-muted)]">{(file.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setUploadedDocs((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
