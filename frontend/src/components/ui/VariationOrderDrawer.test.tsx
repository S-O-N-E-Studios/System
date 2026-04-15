import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import VariationOrderDrawer from './VariationOrderDrawer';

describe('VariationOrderDrawer', () => {
  it('renders create mode', () => {
    render(
      <VariationOrderDrawer
        isOpen
        onClose={vi.fn()}
        canCreate
        canApprove={false}
        onCreate={vi.fn()}
        onSubmit={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText('New Variation Order')).toBeInTheDocument();
  });

  it('calls create handler', () => {
    const onCreate = vi.fn();
    render(
      <VariationOrderDrawer
        isOpen
        onClose={vi.fn()}
        canCreate
        canApprove={false}
        onCreate={onCreate}
        onSubmit={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'Scope change' } });
    fireEvent.change(textareas[1], { target: { value: 'Ground conditions' } });
    fireEvent.change(screen.getByPlaceholderText('Estimated amount in cents (negative allowed)'), {
      target: { value: '10000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Variation Order' }));
    expect(onCreate).toHaveBeenCalledWith({
      description: 'Scope change',
      reason: 'Ground conditions',
      estimatedAmount: 10000,
    });
  });
});

