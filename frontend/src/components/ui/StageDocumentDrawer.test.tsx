import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageDocumentDrawer from './StageDocumentDrawer';

const mockDocuments = [
  { documentName: 'Signed Scoping Report', category: 'scoping-report', uploaded: true, fileName: 'report.pdf' },
  { documentName: 'Quotations', category: 'quotation', uploaded: false },
];

describe('StageDocumentDrawer', () => {
  it('renders stage title', () => {
    render(
      <StageDocumentDrawer
        stage={1}
        documents={mockDocuments}
        gatePassed={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/Stage 1: Inception/)).toBeInTheDocument();
  });

  it('shows missing documents count when gate not passed', () => {
    render(
      <StageDocumentDrawer
        stage={1}
        documents={mockDocuments}
        gatePassed={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/documents? missing/)).toBeInTheDocument();
  });

  it('shows ready message when gate passed', () => {
    render(
      <StageDocumentDrawer
        stage={1}
        documents={mockDocuments.map((d) => ({ ...d, uploaded: true }))}
        gatePassed={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/ready to advance/)).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <StageDocumentDrawer
        stage={1}
        documents={mockDocuments}
        gatePassed={false}
        onClose={onClose}
      />
    );
    const overlay = document.querySelector('.fixed.inset-0');
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders Advance to Stage button when onAdvanceStage provided and stage < 6', () => {
    const onAdvance = vi.fn();
    render(
      <StageDocumentDrawer
        stage={1}
        documents={mockDocuments.map((d) => ({ ...d, uploaded: true }))}
        gatePassed={true}
        onClose={vi.fn()}
        onAdvanceStage={onAdvance}
      />
    );
    const btn = screen.getByTestId('advance-stage-btn');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAdvance).toHaveBeenCalled();
  });

  it('disables Advance button when gate not passed', () => {
    render(
      <StageDocumentDrawer
        stage={1}
        documents={mockDocuments}
        gatePassed={false}
        onClose={vi.fn()}
        onAdvanceStage={vi.fn()}
      />
    );
    expect(screen.getByTestId('advance-stage-btn')).toBeDisabled();
  });
});
