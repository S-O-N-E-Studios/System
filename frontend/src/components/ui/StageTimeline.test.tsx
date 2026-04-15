import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageTimeline from './StageTimeline';

describe('StageTimeline', () => {
  it('renders Project Lifecycle heading', () => {
    render(<StageTimeline currentStage={1} />);
    expect(screen.getByText('Project Lifecycle')).toBeInTheDocument();
  });

  it('renders all 11 stages (0-10)', () => {
    render(<StageTimeline currentStage={3} />);
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByTestId(`stage-${i}`)).toBeInTheDocument();
    }
  });

  it('renders stage names', () => {
    render(<StageTimeline currentStage={1} />);
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('Concept and Viability')).toBeInTheDocument();
  });

  it('calls onStageClick when a stage is clicked', () => {
    const onStageClick = vi.fn();
    render(<StageTimeline currentStage={3} onStageClick={onStageClick} />);
    fireEvent.click(screen.getByTestId('stage-2'));
    expect(onStageClick).toHaveBeenCalledWith(2);
  });

  it('disables future stages', () => {
    render(<StageTimeline currentStage={2} />);
    const stage3 = screen.getByTestId('stage-3');
    expect(stage3).toBeDisabled();
  });

  it('allows clicking completed and current stages', () => {
    const onStageClick = vi.fn();
    render(<StageTimeline currentStage={3} completedStages={[0, 1, 2]} onStageClick={onStageClick} />);
    fireEvent.click(screen.getByTestId('stage-1'));
    fireEvent.click(screen.getByTestId('stage-3'));
    expect(onStageClick).toHaveBeenCalledTimes(2);
  });
});
