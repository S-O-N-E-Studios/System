import Button from '@/components/ui/Button';
import { Upload, FileText, Image, FileSpreadsheet, File } from 'lucide-react';

const filterTabs = ['All', 'Reports', 'Spreadsheets', 'Images', 'Documents'] as const;

const mockFiles = [
  { id: '1', name: 'Monthly Progress Report - Jan 2026.pdf', type: 'report', size: '2.4 MB', date: '28 Jan 2026', project: 'Polokwane Water Treatment' },
  { id: '2', name: 'Budget Summary Q4.xlsx', type: 'spreadsheet', size: '1.1 MB', date: '15 Jan 2026', project: 'Portfolio' },
  { id: '3', name: 'Site Inspection Photos.zip', type: 'image', size: '45.2 MB', date: '20 Jan 2026', project: 'Mokopane Road' },
  { id: '4', name: 'Tender Document - Tzaneen Bridge.docx', type: 'document', size: '3.8 MB', date: '10 Feb 2026', project: 'Tzaneen Bridge' },
  { id: '5', name: 'Geo-Tech Report BH-1 to BH-5.pdf', type: 'report', size: '8.7 MB', date: '05 Feb 2026', project: 'Polokwane Water Treatment' },
  { id: '6', name: 'Construction Schedule v3.xlsx', type: 'spreadsheet', size: '0.9 MB', date: '01 Mar 2026', project: 'Mokopane Road' },
];

const typeIcons: Record<string, typeof FileText> = {
  report: FileText,
  spreadsheet: FileSpreadsheet,
  image: Image,
  document: File,
};

export default function FileManager() {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Files</h1>
      </div>

      {/* Upload zone */}
      <div className="border-2 border-dashed border-[var(--border-strong)] p-8 mb-8 flex flex-col items-center justify-center gap-3 hover:border-[var(--accent)] transition-colors cursor-pointer">
        <Upload className="h-8 w-8 text-[var(--accent-dim)]" />
        <p className="text-body">Drop files here or click to upload</p>
        <p className="text-[0.65rem] text-[var(--text-muted)]">PDF, XLSX, DOCX, PNG, JPG — Max 50MB</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-6">
        {filterTabs.map((tab, i) => (
          <button
            key={tab}
            className={[
              'text-button px-5 py-3 transition-all duration-300',
              i === 0
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* File grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockFiles.map((file) => {
          const Icon = typeIcons[file.type] ?? File;
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
                    <span className="text-[0.65rem] text-[var(--text-muted)]">{file.size}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" className="!text-[0.55rem]">Download</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
