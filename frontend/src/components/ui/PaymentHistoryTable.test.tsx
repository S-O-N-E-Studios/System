import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentHistoryTable from './PaymentHistoryTable';
import type { PaymentHistoryEntry } from '@/types';

const BASE_ROW: PaymentHistoryEntry = {
  id: '1',
  tenantId: 't1',
  projectId: 'p1',
  projectName: 'Polokwane Water Treatment',
  consultantName: 'GeoConsult Inc.',
  invoiceNumber: 'INV-2026-001',
  paymentDate: '2026-01-15T00:00:00.000Z',
  paymentAmount: 1_500_000,
  paymentStatus: 'completed',
};

describe('PaymentHistoryTable', () => {
  it('renders empty state when there are no rows', () => {
    render(<PaymentHistoryTable rows={[]} />);
    expect(screen.getByText(/no payment records found/i)).toBeInTheDocument();
  });

  it('renders payment rows and totals row', () => {
    const rows: PaymentHistoryEntry[] = [
      BASE_ROW,
      { ...BASE_ROW, id: '2', invoiceNumber: 'INV-2026-002', paymentStatus: 'pending' },
    ];

    render(<PaymentHistoryTable rows={rows} />);

    expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    expect(screen.getByText('INV-2026-002')).toBeInTheDocument();
    expect(screen.getByText(/totals/i)).toBeInTheDocument();
  });

  it('calls download and view handlers when actions clicked', () => {
    const handleDownload = vi.fn();
    const handleView = vi.fn();
    const rows: PaymentHistoryEntry[] = [BASE_ROW];

    render(
      <PaymentHistoryTable
        rows={rows}
        onDownloadInvoice={handleDownload}
        onViewInvoice={handleView}
      />
    );

    // Hover to reveal actions then click
    fireEvent.mouseOver(screen.getByText(BASE_ROW.invoiceNumber));

    const downloadButton = screen.getByLabelText(/download invoice/i);
    const viewButton = screen.getByLabelText(/view invoice/i);

    fireEvent.click(downloadButton);
    fireEvent.click(viewButton);

    expect(handleDownload).toHaveBeenCalledTimes(1);
    expect(handleView).toHaveBeenCalledTimes(1);
  });
});

