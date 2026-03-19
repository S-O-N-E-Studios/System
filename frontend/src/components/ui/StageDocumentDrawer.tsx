import { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import Button from './Button';
import { STAGE_NAMES, type ProjectStage, type StageDocumentRequirement } from '@/types';
import { STAGE_DOCUMENT_REQUIREMENTS } from '@/constants/stageDocuments';

interface StageDocumentDrawerProps {
  stage: ProjectStage;
  projectId?: string;
  documents: StageDocumentRequirement[];
  gatePassed: boolean;
  onClose: () => void;
  onAdvanceStage?: () => void;
  onUploadDocument?: (doc: { documentName: string; category: string }) => void;
  isAdvancing?: boolean;
}

export default function StageDocumentDrawer({
  stage,
  documents,
  gatePassed,
  onClose,
  onAdvanceStage,
  onUploadDocument,
  isAdvancing,
}: StageDocumentDrawerProps) {
  const [isOpen] = useState(true);
  const requirements = STAGE_DOCUMENT_REQUIREMENTS[stage];

  // Map requirements to document status (from API or mock)
  const docStatus = requirements.map((req) => {
    const found = documents.find(
      (d) =>
        d.documentName === req.documentName ||
        d.category === req.category
    );
    return {
      ...req,
      uploaded: found?.uploaded ?? false,
      fileName: found?.fileName,
    };
  });

  const missingCount = docStatus.filter((d) => !d.uploaded).length;

  if (!isOpen) return null;

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
        className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border-default)] z-50 shadow-xl flex flex-col animate-slide-in-right"
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

        <div className="flex-1 overflow-y-auto px-6 py-6">
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

          <div className="flex flex-col gap-0">
            {docStatus.map((doc) => (
              <div
                key={doc.documentName}
                className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0"
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
                    {doc.uploaded && doc.fileName && (
                      <p className="text-[0.68rem] text-[var(--text-muted)] truncate">
                        {doc.fileName}
                      </p>
                    )}
                  </div>
                </div>
                {!doc.uploaded && onUploadDocument && (
                  <Button
                    variant="secondary"
                    className="!min-w-0 !px-3 !py-1.5 text-[0.7rem] shrink-0"
                    onClick={() =>
                      onUploadDocument({
                        documentName: doc.documentName,
                        category: doc.category,
                      })
                    }
                  >
                    <Upload className="h-3 w-3" />
                    Upload
                  </Button>
                )}
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
                  Upload all required documents to advance
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
    </>
  );
}
