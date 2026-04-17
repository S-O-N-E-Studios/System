import { useRef, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import Button from './Button';
import ApprovalStatusBadge from './ApprovalStatusBadge';
import ClientApprovalPanel from './ClientApprovalPanel';
import { STAGE_NAMES, type ProjectStage, type StageDocumentRequirement } from '@/types';

interface StageDocumentDrawerProps {
  stage: ProjectStage;
  projectId?: string;
  requirements: Array<{ documentName: string; category: string; group?: string }>;
  documents: StageDocumentRequirement[];
  gatePassed: boolean;
  onClose: () => void;
  onAdvanceStage?: () => void;
  onUploadDocument?: (doc: { documentName: string; category: string; file: File }) => Promise<void> | void;
  canApproveDocuments?: boolean;
  onApproveDocument?: (fileId: string) => Promise<void> | void;
  onRejectDocument?: (fileId: string, reason: string) => Promise<void> | void;
  onNotifyClient?: (fileId: string) => Promise<void> | void;
  isAdvancing?: boolean;
}

interface DrawerDocumentStatus {
  documentName: string;
  category: string;
  uploaded: boolean;
  fileName?: string;
  fileId?: string;
  approvalStatus?: StageDocumentRequirement['approvalStatus'];
  notificationSentAt?: string;
  notificationSentCount?: number;
}

export default function StageDocumentDrawer({
  stage,
  requirements,
  documents,
  gatePassed,
  onClose,
  onAdvanceStage,
  onUploadDocument,
  canApproveDocuments,
  onApproveDocument,
  onRejectDocument,
  onNotifyClient,
  isAdvancing,
}: StageDocumentDrawerProps) {
  const [isOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingUploadDoc, setPendingUploadDoc] = useState<{
    documentName: string;
    category: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Map requirements to document status (from API or mock)
  const docStatus: DrawerDocumentStatus[] = requirements.map((req) => {
    const found = documents.find(
      (d) =>
        d.documentName === req.documentName ||
        d.category === req.category
    );
    return {
      documentName: req.documentName,
      category: req.category,
      uploaded: found?.uploaded ?? false,
      fileName: found?.fileName,
      fileId: found?.fileId,
      approvalStatus: found?.approvalStatus,
      notificationSentAt: found?.notificationSentAt,
      notificationSentCount: found?.notificationSentCount,
    };
  });

  const missingCount = docStatus.filter((d) => !d.uploaded).length;
  const missingDocsText = docStatus
    .filter((d) => !d.uploaded)
    .map((d) => `${d.documentName} (${d.category})`)
    .join(', ');
  const groupedDocStatus = docStatus.reduce<Record<string, DrawerDocumentStatus[]>>((acc, doc) => {
    const requirement = requirements.find(
      (req) => req.documentName === doc.documentName || req.category === doc.category,
    );
    const groupName = requirement?.group || 'Required Documents';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(doc);
    return acc;
  }, {});

  if (!isOpen) return null;

  const startUpload = (doc: { documentName: string; category: string }) => {
    if (!onUploadDocument) return;
    setPendingUploadDoc(doc);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pendingUploadDoc || !onUploadDocument) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUploadDocument({
        documentName: pendingUploadDoc.documentName,
        category: pendingUploadDoc.category,
        file,
      });
      setPendingUploadDoc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close drawer"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="presentation"
      >
        <div
          className="w-full max-w-2xl max-h-[calc(100vh-4rem)] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xl flex flex-col animate-fade-in"
          role="dialog"
          aria-labelledby="stage-drawer-title"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] shrink-0">
            <h2 id="stage-drawer-title" className="text-h3">
              Stage {stage}: {STAGE_NAMES[stage]}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
 
          <div className="overflow-y-auto px-6 py-6">
            <div className="flex items-center gap-2 mb-6">
              {gatePassed ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-[var(--status-success)]" />
                  <span className="text-[0.82rem] font-medium text-[var(--status-success)]">
                    All documents uploaded; ready to advance
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-[var(--status-danger)]" />
                  <span className="text-[0.82rem] font-medium text-[var(--status-danger)]">
                    {missingCount} document{missingCount !== 1 ? 's' : ''} missing
                  </span>
                </>
              )}
            </div>
 
            <div className="flex flex-col gap-5">
              {Object.entries(groupedDocStatus).map(([group, docs]) => (
                <div key={group}>
                  <p className="text-eyebrow mb-2">{group}</p>
                  <div className="flex flex-col gap-0 border border-[var(--border-default)] bg-[var(--bg-primary)]">
                    {docs.map((doc) => (
                      <div
                        key={doc.documentName}
                        className="flex items-center justify-between py-3 px-3 border-b border-[var(--border-default)] last:border-0"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {doc.uploaded ? (
                            <CheckCircle2 className="h-5 w-5 text-[var(--status-success)] shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-[var(--status-danger)] shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="text-[0.82rem] font-medium text-[var(--text-primary)]">
                              {doc.documentName}
                            </p>
                            <div className="mt-1">
                              <ApprovalStatusBadge status={doc.approvalStatus || 'not_required'} />
                            </div>
                            {doc.uploaded && doc.fileName && (
                              <p className="text-[0.68rem] text-[var(--text-muted)] truncate">
                                {doc.fileName}
                              </p>
                            )}
                            <ClientApprovalPanel
                              canApprove={Boolean(canApproveDocuments)}
                              approvalStatus={doc.approvalStatus || 'not_required'}
                              notificationSentAt={doc.notificationSentAt}
                              notificationSentCount={doc.notificationSentCount}
                              onApprove={
                                doc.fileId
                                  ? () => onApproveDocument?.(doc.fileId!)
                                  : undefined
                              }
                              onReject={
                                doc.fileId
                                  ? (reason) => onRejectDocument?.(doc.fileId!, reason)
                                  : undefined
                              }
                              onNotifyClient={
                                doc.fileId
                                  ? () => onNotifyClient?.(doc.fileId!)
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                        {!doc.uploaded && onUploadDocument && (
                          <Button
                            variant="secondary"
                            className="!min-w-0 !px-3 !py-1.5 text-[0.7rem] shrink-0"
                            onClick={() =>
                              startUpload({
                                documentName: doc.documentName,
                                category: doc.category,
                              })
                            }
                            disabled={isUploading}
                          >
                            <Upload className="h-3 w-3" />
                            Upload
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
 
          {onAdvanceStage && stage < 6 && (
            <div className="px-6 py-4 border-t border-[var(--border-default)] shrink-0">
              <div className="relative group/btn inline-block">
                <Button
                  variant="primary"
                  onClick={onAdvanceStage}
                  disabled={!gatePassed}
                  isLoading={isAdvancing}
                  data-testid="advance-stage-btn"
                >
                  Advance to Stage {stage + 1}
                </Button>
                {!gatePassed && (
                  <div
                    className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[0.68rem] text-[var(--text-muted)] whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-10"
                    role="tooltip"
                  >
                    {missingDocsText
                      ? `Missing: ${missingDocsText}`
                      : 'Upload all required documents to advance'}
                  </div>
                )}
              </div>
            </div>
          )}
 
          {stage === 6 && gatePassed && onAdvanceStage && (
            <div className="px-6 py-4 border-t border-[var(--border-default)] shrink-0">
              <Button
                variant="primary"
                onClick={onAdvanceStage}
                isLoading={isAdvancing}
                data-testid="mark-project-complete-btn"
              >
                Mark Project Complete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file picker for stage document uploads */}
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Upload stage document"
        accept=".pdf,.xlsx,.docx,.csv,.dwg,.png,.jpg,.jpeg"
      />
    </>
  );
}
