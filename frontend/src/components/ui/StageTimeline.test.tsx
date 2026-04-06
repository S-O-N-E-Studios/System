import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageTimeline from './StageTimeline';

describe('StageTimeline', () => {
  it('renders Project Stage heading', () => {
    render(<StageTimeline currentStage={1} />);
    expect(screen.getByText('Project Stage')).toBeInTheDocument();
  });

  it('renders all 6 stages', () => {
    render(<StageTimeline currentStage={3} />);
    expect(screen.getByTestId('stage-1')).toBeInTheDocument();
    expect(screen.getByTestId('stage-2')).toBeInTheDocument();
    expect(screen.getByTestId('stage-3')).toBeInTheDocument();
    expect(screen.getByTestId('stage-4')).toBeInTheDocument();
    expect(screen.getByTestId('stage-5')).toBeInTheDocument();
    expect(screen.getByTestId('stage-6')).toBeInTheDocument();
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
    render(<StageTimeline currentStage={3} completedStages={[1, 2]} onStageClick={onStageClick} />);
    fireEvent.click(screen.getByTestId('stage-1'));
    fireEvent.click(screen.getByTestId('stage-3'));
    expect(onStageClick).toHaveBeenCalledTimes(2);
  });
});
