import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useUiStore } from '@/store/uiStore';
import { Upload, FileText, FileSpreadsheet, Image, File } from 'lucide-react';
import type { DocumentType, FileCategory, ProjectFile } from '@/types';
import { formatFileSize } from '@/utils/formatters';
import EmptyState from '@/components/ui/EmptyState';
import SuccessAnimation from '@/components/ui/SuccessAnimation';
import { filesApi } from '@/api/files';
import { projectsApi } from '@/api/projects';

const FILE_UPLOAD_MODAL_ID = 'file-upload';

const DOCUMENT_TYPE_TABS: { key: 'all' | DocumentType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'payment_certificate', label: 'Payment Certificates' },
  { key: 'tender_document', label: 'Tender Documents' },
  { key: 'drawings', label: 'Drawings' },
  { key: 'digital_survey', label: 'Digital Survey' },
  { key: 'geo_technical_report', label: 'Geo-Technical Reports' },
  { key: 'environmental_report', label: 'Environmental Reports' },
];

/** Document types only (no "All") for upload modal */
const UPLOAD_DOCUMENT_TYPES: { value: DocumentType; label: string }[] = DOCUMENT_TYPE_TABS.filter(
  (t): t is { key: DocumentType; label: string } => t.key !== 'all'
).map((t) => ({ value: t.key, label: t.label }));

const EXTENSION_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All file types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'docx', label: 'DOCX' },
  { value: 'csv', label: 'CSV' },
  { value: 'dwg', label: 'DWG' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
];

interface FileCard {
  id: string;
  name: string;
  documentType: DocumentType;
  size: number;
  date: string;
  project: string;
  mimeType: string;
  downloadUrl?: string;
}

function entityId<T extends { id?: string; _id?: string }>(item: T): string {
  return item.id || item._id || '';
}

function fileCategoryToDocumentType(category: FileCategory): DocumentType {
  if (category === 'payment-certificate') return 'payment_certificate';
  if (category === 'tender-document' || category === 'tender-evaluation') return 'tender_document';
  if (
    category === 'tender-drawing' ||
    category === 'as-built-drawing' ||
    category === 'preliminary-design' ||
    category === 'detailed-design'
  ) {
    return 'drawings';
  }
  if (category === 'digital-survey') return 'digital_survey';
  if (category === 'geotechnical') return 'geo_technical_report';
  if (category === 'environmental') return 'environmental_report';
  return 'tender_document';
}

function mapProjectFileToFileCard(pf: ProjectFile): FileCard {
  const uploaded = new Date(pf.createdAt);
  const dateStr = uploaded.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const size = pf.sizeBytes ?? pf.size;
  return {
    id: entityId(pf as ProjectFile & { _id?: string }),
    name: pf.originalName,
    documentType: fileCategoryToDocumentType(pf.category),
    size,
    date: dateStr,
    project: pf.projectId ? `Project ${pf.projectId}` : 'Tenant',
    mimeType: pf.mimeType,
    downloadUrl: pf.url,
  };
}

function documentTypeToCategory(documentType: DocumentType): FileCategory {
  switch (documentType) {
    case 'payment_certificate':
      return 'payment-certificate';
    case 'tender_document':
      return 'tender-document';
    case 'drawings':
      return 'tender-drawing';
    case 'digital_survey':
      return 'digital-survey';
    case 'geo_technical_report':
      return 'geotechnical';
    case 'environmental_report':
      return 'environmental';
    default:
      return 'other';
  }
}

function getIconForDocType(documentType: DocumentType): typeof FileText {
  switch (documentType) {
    case 'payment_certificate':
    case 'tender_document':
    case 'environmental_report':
    case 'geo_technical_report':
      return FileText;
    case 'drawings':
      return Image;
    case 'digital_survey':
      return FileSpreadsheet;
    default:
      return File;
  }
}

function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export default function FileManager() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { openModal, closeModal } = useUiStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | DocumentType>('all');
  const [extensionFilter, setExtensionFilter] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>('payment_certificate');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fetchedFiles, setFetchedFiles] = useState<FileCard[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: filesPage } = useQuery({
    queryKey: ['files', 'list', tenantSlug],
    queryFn: () =>
      filesApi.list({
        tenantSlug: tenantSlug!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(tenantSlug),
  });
  const { data: projectsPage } = useQuery({
    queryKey: ['projects', 'for-file-manager', tenantSlug],
    queryFn: () => projectsApi.list({ limit: 100 }),
    enabled: Boolean(tenantSlug),
  });

  useEffect(() => {
    if (!filesPage?.data) {
      setFetchedFiles([]);
      return;
    }
    setFetchedFiles(filesPage.data.map(mapProjectFileToFileCard));
  }, [filesPage]);

  useEffect(() => {
    if (!uploadSuccess) return;
    const t = setTimeout(() => {
      setUploadSuccess(false);
      closeModal();
    }, 2200);
    return () => clearTimeout(t);
  }, [uploadSuccess, closeModal]);

  useEffect(() => {
    if (!selectedProjectId && projectsPage?.projects?.length) {
      const firstProjectId = entityId(projectsPage.projects[0] as { id?: string; _id?: string });
      if (firstProjectId) setSelectedProjectId(firstProjectId);
    }
  }, [projectsPage, selectedProjectId]);

  const projectNameById = new Map((projectsPage?.projects || []).map((project) => [entityId(project as { id?: string; _id?: string }), project.name]));
  const allFiles = fetchedFiles.map((file) => ({
    ...file,
    project: projectNameById.get(file.project.replace('Project ', '')) || file.project,
  }));

  const byTab =
    activeTab === 'all' ? allFiles : allFiles.filter((f) => f.documentType === activeTab);

  const displayedFiles =
    !extensionFilter
      ? byTab
      : byTab.filter((f) => getFileExtension(f.name) === extensionFilter);

  const handleUploadZoneClick = () => openModal(FILE_UPLOAD_MODAL_ID);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(files);
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || !tenantSlug || !selectedProjectId) return;
    setIsUploading(true);
    try {
      await Promise.all(
        selectedFiles.map((file) =>
          filesApi.uploadStageDocument({
            tenantSlug,
            projectId: selectedProjectId,
            stage: 1,
            category: documentTypeToCategory(selectedDocumentType),
            file,
          })
        )
      );
      await queryClient.invalidateQueries({ queryKey: ['files', 'list', tenantSlug] });
      setSelectedFiles([]);
      setUploadSuccess(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file: FileCard) => {
    const downloadUrl =
      file.downloadUrl ||
      (tenantSlug ? await filesApi.getDownloadUrl({ tenantSlug, id: file.id }) : null);
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name;
    a.click();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Files</h1>
      </div>

      {/* Upload zone: opens modal */}
      <button
        type="button"
        onClick={handleUploadZoneClick}
        className="w-full border-2 border-dashed border-[var(--border-strong)] p-8 mb-8 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent)] transition-colors cursor-pointer bg-transparent text-left"
      >
        <Upload className="h-8 w-8 text-[var(--accent-dim)]" />
        <p className="text-body">Drop files here or click to upload</p>
        <p className="text-[0.65rem] text-[var(--text-muted)]">
          PDF, XLSX, DOCX, PNG, JPG; Max 50MB. Assign a document type in the upload dialog.
        </p>
      </button>

      {/* Document-type tabs + secondary extension filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-0 border-b border-[var(--border)] flex-1">
          {DOCUMENT_TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                'text-button px-4 py-3 transition-all duration-300',
                activeTab === tab.key
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 shrink-0">
          <span className="text-[0.7rem] text-[var(--text-muted)]">File type:</span>
          <select
            value={extensionFilter}
            onChange={(e) => setExtensionFilter(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-[0.8rem] px-3 py-2 min-w-[120px]"
          >
            {EXTENSION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* File grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedFiles.length === 0 ? (
          <div className="col-span-full border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]">
            <EmptyState
              title={byTab.length === 0 ? 'No files in this category yet.' : 'No files match the selected type.'}
              description="Try adjusting the filters or uploading documents for this category."
              className="py-16"
              animationClassName="w-40 h-40"
            />
          </div>
        ) : (
          displayedFiles.map((file) => {
            const Icon = getIconForDocType(file.documentType);
            return (
              <div
                key={file.id}
                className="group bg-[var(--bg-card)] border border-[var(--border)] p-5 hover:border-[var(--accent)] transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <Icon className="h-8 w-8 text-[var(--accent-dim)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] font-body font-medium text-[var(--text-primary)] truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[0.6rem] px-2 py-0.5 bg-[var(--accent-glow)] border border-[var(--border)] text-[var(--accent)]">
                        {file.project}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[0.65rem] text-[var(--text-muted)]">{file.date}</span>
                      <span className="text-[0.65rem] text-[var(--text-muted)]">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    className="!text-[0.55rem]"
                    onClick={() => handleDownload(file)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload modal: user must tag files with a document category */}
      <Modal
        modalId={FILE_UPLOAD_MODAL_ID}
        title={uploadSuccess ? 'Upload complete' : 'Upload files'}
        size="lg"
        onClose={() => { setSelectedFiles([]); setUploadSuccess(false); }}
      >
        {uploadSuccess ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <SuccessAnimation className="w-28 h-28" ariaLabel="Upload successful" />
            <p className="text-body text-[var(--text-primary)]">Files uploaded successfully.</p>
          </div>
        ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-eyebrow text-[var(--text-muted)] mb-2">
              Document category (required)
            </label>
            <select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value as DocumentType)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-[0.9rem] px-4 py-3"
            >
              {UPLOAD_DOCUMENT_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-eyebrow text-[var(--text-muted)] mb-2">
              Project (required)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-[0.9rem] px-4 py-3"
            >
              <option value="">Select project</option>
              {(projectsPage?.projects || []).map((project) => (
                <option key={entityId(project as { id?: string; _id?: string })} value={entityId(project as { id?: string; _id?: string })}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.docx,.csv,.dwg,.png,.jpg,.jpeg"
              onChange={handleFileInputChange}
              className="sr-only"
              aria-label="Choose files to upload"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose files
            </Button>
            {selectedFiles.length > 0 && (
              <p className="mt-2 text-[0.8rem] text-[var(--text-secondary)]">
                {selectedFiles.length} file(s) selected: {selectedFiles.map((f) => f.name).join(', ')}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => closeModal()}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleUploadSubmit}
              disabled={selectedFiles.length === 0 || !selectedProjectId || isUploading}
            >
              {isUploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
}
