import type { DocumentType } from '@/types';

export type MockFileCard = {
  id: string;
  name: string;
  documentType: DocumentType;
  size: number;
  date: string;
  project: string;
  mimeType: string;
  blobUrl?: string;
};

export const MOCK_FILE_MANAGER_FILES: MockFileCard[] = [
  { id: '1', name: 'Payment Certificate - Feb 2026.pdf', documentType: 'payment_certificate', size: 2_450_000, date: '28 Feb 2026', project: 'Polokwane Water Treatment', mimeType: 'application/pdf' },
  { id: '2', name: 'PC-001 Polokwane Phase 1.pdf', documentType: 'payment_certificate', size: 1_100_000, date: '15 Jan 2026', project: 'Polokwane Water Treatment', mimeType: 'application/pdf' },
  { id: '3', name: 'Tender Document - Tzaneen Bridge.docx', documentType: 'tender_document', size: 3_800_000, date: '10 Feb 2026', project: 'Tzaneen Bridge', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { id: '4', name: 'Tender SBD Forms - Mokopane.xlsx', documentType: 'tender_document', size: 890_000, date: '05 Feb 2026', project: 'Mokopane Road', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { id: '5', name: 'Road Layout Section A-A.pdf', documentType: 'drawings', size: 4_200_000, date: '20 Jan 2026', project: 'Mokopane Road', mimeType: 'application/pdf' },
  { id: '6', name: 'Structural Details Rev 2.dwg', documentType: 'drawings', size: 8_700_000, date: '12 Feb 2026', project: 'Tzaneen Bridge', mimeType: 'application/acad' },
  { id: '7', name: 'Survey Points Export.csv', documentType: 'digital_survey', size: 520_000, date: '01 Mar 2026', project: 'Polokwane Water Treatment', mimeType: 'text/csv' },
  { id: '8', name: 'GPS Control Network.xlsx', documentType: 'digital_survey', size: 340_000, date: '18 Feb 2026', project: 'Mokopane Road', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { id: '9', name: 'Geo-Tech Report BH-1 to BH-5.pdf', documentType: 'geo_technical_report', size: 8_700_000, date: '05 Feb 2026', project: 'Polokwane Water Treatment', mimeType: 'application/pdf' },
  { id: '10', name: 'Borehole Log Summary.pdf', documentType: 'geo_technical_report', size: 2_100_000, date: '22 Jan 2026', project: 'Tzaneen Bridge', mimeType: 'application/pdf' },
  { id: '11', name: 'Environmental Impact Assessment.pdf', documentType: 'environmental_report', size: 12_400_000, date: '14 Feb 2026', project: 'Tzaneen Bridge', mimeType: 'application/pdf' },
  { id: '12', name: 'EIA Addendum - Water Quality.pdf', documentType: 'environmental_report', size: 1_800_000, date: '28 Feb 2026', project: 'Polokwane Water Treatment', mimeType: 'application/pdf' },
];
