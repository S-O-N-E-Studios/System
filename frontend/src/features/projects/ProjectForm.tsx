import { useRef, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  projectFormSchemaForOrgType,
  type OrgType,
  type ProjectFormData,
} from '@/types';
import { SERVICE_CATEGORY_LABELS } from '@/types';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { useUiStore } from '@/store/uiStore';
import { organizationApi } from '@/api/organization';
import { projectsApi } from '@/api/projects';
import { filesApi } from '@/api/files';
import { ArrowLeft, Upload, X as XIcon, FileText } from 'lucide-react';

const FALLBACK_MUNICIPALITIES = [
  'Victor Khanye',
  'Emalahleni',
  'Steve Tshwete',
  'Emakhazeni',
  'Thembisile Hani',
  'Dr JS Moroka',
];

type ProjectFormBodyProps = {
  tenantSlug: string;
  projectId?: string;
  isEdit: boolean;
  orgType: OrgType;
  municipalityOptions: string[];
};

function ProjectFormBody({
  tenantSlug,
  projectId,
  isEdit,
  orgType,
  municipalityOptions,
}: ProjectFormBodyProps) {
  const navigate = useNavigate();
  const { addToast } = useUiStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [isPrefilling, setIsPrefilling] = useState(isEdit);

  const schema = useMemo(() => projectFormSchemaForOrgType(orgType), [orgType]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(schema),
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

  const isProvincial = orgType === 'provincial_gov';

  useEffect(() => {
    let cancelled = false;
    async function loadProjectForEdit() {
      if (!isEdit || !tenantSlug || !projectId) {
        setIsPrefilling(false);
        return;
      }
      try {
        const project = await projectsApi.getById(projectId);
        if (cancelled) return;
        reset({
          name: project.name,
          contractValue: Number(project.contractValueOriginal || project.contractValue || 0) / 100,
          status: project.status,
          contractTypes:
            project.contractTypes?.length
              ? project.contractTypes
              : ['professional'],
          serviceCategory: project.serviceCategory,
          localMunicipality: project.localMunicipality || '',
          idpProjectNo: project.idpProjectNo || '',
          location: {
            address: project.location?.address || '',
          },
          geoTecEngineer: project.geoTecEngineer || '',
          contractor: project.contractor || '',
        });
        setAppointmentDate(project.appointmentDate?.slice(0, 10) || '');
        setCompletionDate(project.completionDate?.slice(0, 10) || '');
      } catch {
        if (!cancelled) {
          addToast({ type: 'error', message: 'Could not load project details for editing.' });
          navigate(`/${tenantSlug}/projects`);
        }
      } finally {
        if (!cancelled) setIsPrefilling(false);
      }
    }
    void loadProjectForEdit();
    return () => {
      cancelled = true;
    };
  }, [addToast, isEdit, navigate, projectId, reset, tenantSlug]);

  if (isPrefilling) {
    return (
      <div className="animate-fade-in max-w-3xl p-8 text-[0.82rem] text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-card)]">
        Loading project details…
      </div>
    );
  }

  const onSubmit = async (values: ProjectFormData) => {
    try {
      const payload = {
        name: values.name,
        serviceCategory: values.serviceCategory,
        localMunicipality: values.localMunicipality || undefined,
        idpProjectNo: values.idpProjectNo || undefined,
        contractTypes: values.contractTypes,
        contractValueOriginal: Math.round((values.contractValue || 0) * 100),
        status: values.status,
        location: values.location?.address ? { address: values.location.address } : undefined,
        geoTecEngineer: values.geoTecEngineer || undefined,
        contractor: values.contractor || undefined,
        appointmentDate: appointmentDate || undefined,
        completionDate: completionDate || undefined,
      };

      const project = isEdit && projectId
        ? await projectsApi.update(projectId, payload)
        : await projectsApi.create(payload);

      if (uploadedDocs.length > 0) {
        await Promise.all(
          uploadedDocs.map((file) =>
            filesApi.uploadStageDocument({
              tenantSlug,
              projectId: project.id,
              stage: 1,
              category: 'other',
              file,
            })
          )
        );
      }

      addToast({ type: 'success', message: isEdit ? 'Project updated.' : 'Project created.' });
      navigate(`/${tenantSlug}/projects/${project.id}`);
    } catch (error) {
      const message =
        axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined;
      addToast({
        type: 'error',
        message:
          message ||
          (isEdit ? 'Could not update project.' : 'Could not create project.'),
      });
    }
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

      <p className="text-[0.72rem] text-[var(--text-muted)] mb-6">
        {isProvincial
          ? 'Provincial workspace: link projects to your IDP and local municipality scope.'
          : 'Private firm workspace: municipal IDP fields are hidden; focus on client contracts and delivery.'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
          <h3 className="text-h3">Project Details</h3>

          <FormInput
            label="Project Name"
            placeholder={
              isProvincial
                ? 'e.g. Polokwane Water Treatment Upgrade'
                : 'e.g. Client site civil works package'
            }
            error={errors.name?.message}
            {...register('name')}
          />

          {isEdit && <FormInput label="Reference Code" value={projectId || 'Loading...'} disabled />}

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

          {isProvincial && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-eyebrow text-[var(--text-muted)]">Local Municipality</label>
                <select
                  className="w-full bg-transparent border-0 border-b border-[var(--border)] py-2 font-body text-[0.82rem] font-light text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-[border-color] duration-200"
                  {...register('localMunicipality')}
                >
                  <option value="" className="bg-[var(--bg-card)]">Select municipality</option>
                  {municipalityOptions.map((m) => (
                    <option key={m} value={m} className="bg-[var(--bg-card)]">
                      {m}
                    </option>
                  ))}
                </select>
                {errors.localMunicipality?.message && (
                  <p className="text-[0.68rem] text-[var(--status-danger)]">{errors.localMunicipality.message}</p>
                )}
              </div>

              <FormInput
                label="IDP Project No"
                placeholder="e.g. IDP-2026-001"
                error={errors.idpProjectNo?.message}
                {...register('idpProjectNo')}
              />
            </>
          )}

          <FormInput
            label="Project Address"
            placeholder="Street, city, province, South Africa"
            error={errors.location?.address?.message}
            {...register('location.address')}
          />
          <p className="text-[0.68rem] text-[var(--text-muted)]">
            Use a full address for project locations. Coordinate entry is no longer part of the form.
          </p>

          <FormInput
            label="Geo-Tec Engineer"
            placeholder="Firm name (optional)"
            {...register('geoTecEngineer')}
          />
        </div>

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

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-6">
          <h3 className="text-h3">Initial Documents</h3>
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            Attach scoping reports, quotations, or appointment letters for Stage 1. Additional stage documents are uploaded from the Project Detail view.
          </p>

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

          {uploadedDocs.length > 0 && (
            <ul className="space-y-2">
              {uploadedDocs.map((file, idx) => (
                <li key={`${file.name}-${idx}`} className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)]">
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

export default function ProjectForm() {
  const { tenantSlug = '', id } = useParams<{ tenantSlug: string; id?: string }>();
  const isEdit = Boolean(id);

  const [orgReady, setOrgReady] = useState(false);
  const [orgType, setOrgType] = useState<OrgType>('private_firm');
  const [municipalityOptions, setMunicipalityOptions] = useState<string[]>(FALLBACK_MUNICIPALITIES);

  useEffect(() => {
    if (!tenantSlug) {
      setOrgReady(true);
      return;
    }
    let cancelled = false;
    organizationApi
      .get()
      .then((org) => {
        if (cancelled) return;
        setOrgType(org.orgType ?? 'private_firm');
        if (org.localMunicipalities?.length) {
          setMunicipalityOptions(org.localMunicipalities);
        } else {
          setMunicipalityOptions(FALLBACK_MUNICIPALITIES);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrgType('private_firm');
          setMunicipalityOptions(FALLBACK_MUNICIPALITIES);
        }
      })
      .finally(() => {
        if (!cancelled) setOrgReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  if (!orgReady) {
    return (
      <div className="animate-fade-in max-w-3xl p-8 text-[0.82rem] text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-card)]">
        Loading organisation profile…
      </div>
    );
  }

  if (isEdit && !id) {
    return null;
  }

  return (
    <ProjectFormBody
      key={orgType}
      tenantSlug={tenantSlug}
      projectId={id}
      isEdit={isEdit}
      orgType={orgType}
      municipalityOptions={municipalityOptions}
    />
  );
}
