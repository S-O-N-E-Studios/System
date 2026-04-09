import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';
import { useUiStore } from '@/store/uiStore';

describe('Modal', () => {
  beforeEach(() => {
    useUiStore.setState({
      activeModal: null,
      modalData: null,
      toasts: [],
    });
  });

  it('does not render when modal is not active', () => {
    render(<Modal modalId="test-modal" title="Test"><p>Content</p></Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when modal is active', () => {
    useUiStore.setState({ activeModal: 'test-modal' });
    render(<Modal modalId="test-modal" title="My Modal"><p>Body text</p></Modal>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('has aria-modal attribute', () => {
    useUiStore.setState({ activeModal: 'test-modal' });
    render(<Modal modalId="test-modal" title="Test"><p>Hi</p></Modal>);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('closes when close button is clicked', () => {
    useUiStore.setState({ activeModal: 'test-modal' });
    render(<Modal modalId="test-modal" title="Test"><p>Hi</p></Modal>);

    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(useUiStore.getState().activeModal).toBeNull();
  });

  it('closes when backdrop is clicked', () => {
    useUiStore.setState({ activeModal: 'test-modal' });
    render(<Modal modalId="test-modal" title="Test"><p>Hi</p></Modal>);

    // Modal is rendered via portal into document.body, so query there
    const backdrop = document.body.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop);
    expect(useUiStore.getState().activeModal).toBeNull();
  });

  it('closes on Escape key', () => {
    useUiStore.setState({ activeModal: 'test-modal' });
    render(<Modal modalId="test-modal" title="Test"><p>Hi</p></Modal>);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useUiStore.getState().activeModal).toBeNull();
  });

  it('applies correct size class', () => {
    useUiStore.setState({ activeModal: 'test-modal' });
    render(<Modal modalId="test-modal" title="Test" size="lg"><p>Hi</p></Modal>);

    const panel = screen.getByRole('dialog').querySelector('.max-w-2xl');
    expect(panel).toBeInTheDocument();
  });

  it('does not render title section when title is omitted', () => {
    useUiStore.setState({ activeModal: 'test-modal' });
    render(<Modal modalId="test-modal"><p>No title</p></Modal>);

    expect(screen.getByText('No title')).toBeInTheDocument();
    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
  });

  it('calls onClose callback when closing', () => {
    let closed = false;
    useUiStore.setState({ activeModal: 'test-modal' });
    render(
      <Modal modalId="test-modal" title="Test" onClose={() => { closed = true; }}>
        <p>Hi</p>
      </Modal>
    );

    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(closed).toBe(true);
  });

  it('renders via a portal into document.body (not the render container)', () => {
    useUiStore.setState({ activeModal: 'portal-modal' });
    const { container } = render(
      <Modal modalId="portal-modal" title="Portal Test"><p>portal content</p></Modal>,
    );
    // The dialog must NOT be inside the test container but must exist in the document
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
