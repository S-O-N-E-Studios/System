import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useUiStore } from '@/store/uiStore';
import { Upload, FileText, FileSpreadsheet, Image, File } from 'lucide-react';
import type { DocumentType, ProjectFile } from '@/types';
import { formatFileSize } from '@/utils/formatters';
import EmptyState from '@/components/ui/EmptyState';
import SuccessAnimation from '@/components/ui/SuccessAnimation';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useFiles, useUploadFile } from '@/hooks/useFiles';

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

function getIconForDocType(documentType?: DocumentType): typeof FileText {
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

function mapToDisplayFile(f: ProjectFile) {
  return {
    id: f.id,
    name: f.originalName,
    documentType: f.documentType,
    size: f.size,
    date: f.createdAt,
    project: f.projectId ?? '',
    mimeType: f.mimeType,
  };
}

export default function FileManager() {
  const { openModal, closeModal } = useUiStore();
  const [activeTab, setActiveTab] = useState<'all' | DocumentType>('all');
  const [extensionFilter, setExtensionFilter] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>('payment_certificate');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const category = activeTab === 'all' ? undefined : activeTab;
  const { data: filesResponse, isLoading, error } = useFiles({ category });
  const uploadMutation = useUploadFile();

  const allFiles = (filesResponse?.data ?? []).map(mapToDisplayFile);

  useEffect(() => {
    if (!uploadSuccess) return;
    const t = setTimeout(() => {
      setUploadSuccess(false);
      closeModal();
    }, 2200);
    return () => clearTimeout(t);
  }, [uploadSuccess, closeModal]);

  const displayedFiles =
    !extensionFilter
      ? allFiles
      : allFiles.filter((f) => getFileExtension(f.name) === extensionFilter);

  const handleUploadZoneClick = () => openModal(FILE_UPLOAD_MODAL_ID);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(files);
  };

  const handleUploadSubmit = async () => {
    try {
      for (const file of selectedFiles) {
        await uploadMutation.mutateAsync({ file });
      }
      setSelectedFiles([]);
      setUploadSuccess(true);
    } catch {
      // error handled by mutation state
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] relative">
        <LoadingOverlay fullscreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-[0.82rem] text-[var(--status-danger)]">
          Failed to load files. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Files</h1>
      </div>

      {/* Upload zone */}
      <button
        type="button"
        onClick={handleUploadZoneClick}
        className="w-full border-2 border-dashed border-[var(--border-strong)] p-8 mb-8 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent)] transition-colors cursor-pointer bg-transparent text-left"
      >
        <Upload className="h-8 w-8 text-[var(--accent-dim)]" />
        <p className="text-body">Drop files here or click to upload</p>
        <p className="text-[0.65rem] text-[var(--text-muted)]">
          PDF, XLSX, DOCX, PNG, JPG — Max 50MB. Assign a document type in the upload dialog.
        </p>
      </button>

      {/* Document-type tabs + secondary extension filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-0 border-b border-[var(--border)] overflow-x-auto flex-1">
          {DOCUMENT_TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                'text-button px-4 py-3 whitespace-nowrap transition-all duration-300',
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
              title={allFiles.length === 0 ? 'No files in this category yet.' : 'No files match the selected type.'}
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
                    {file.project && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[0.6rem] px-2 py-0.5 bg-[var(--accent-glow)] border border-[var(--border)] text-[var(--accent)]">
                          {file.project}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[0.65rem] text-[var(--text-muted)]">{file.date}</span>
                      <span className="text-[0.65rem] text-[var(--text-muted)]">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" className="!text-[0.55rem]">Download</Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload modal */}
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
              disabled={selectedFiles.length === 0}
              isLoading={uploadMutation.isPending}
            >
              Upload
            </Button>
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
}
