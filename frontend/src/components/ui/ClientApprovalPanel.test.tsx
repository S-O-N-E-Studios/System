import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ClientApprovalPanel from './ClientApprovalPanel';

describe('ClientApprovalPanel', () => {
  it('does not render when approval is not pending', () => {
    const { container } = render(
      <ClientApprovalPanel canApprove approvalStatus="approved" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls approve handler', () => {
    const onApprove = vi.fn();
    render(
      <ClientApprovalPanel canApprove approvalStatus="pending" onApprove={onApprove} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('submits rejection reason', () => {
    const onReject = vi.fn();
    render(
      <ClientApprovalPanel canApprove approvalStatus="pending" onReject={onReject} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.change(screen.getByPlaceholderText('Enter rejection reason'), {
      target: { value: 'Need revision' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Rejection' }));
    expect(onReject).toHaveBeenCalledWith('Need revision');
  });
});

