import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GanttChart from './GanttChart';
import type { ScheduleActivity } from '@/types';

const ACTIVITIES: ScheduleActivity[] = [
  { id: '1', name: 'Site establishment', startDate: '2026-01-01', endDate: '2026-02-15', status: 'on_track' },
  { id: '2', name: 'Earthworks', startDate: '2026-02-01', endDate: '2026-03-31', status: 'at_risk' },
];

describe('GanttChart', () => {
  it('renders empty state when there are no activities', () => {
    render(<GanttChart activities={[]} />);
    expect(screen.getByText(/no activities scheduled yet/i)).toBeInTheDocument();
  });

  it('renders activity names in the left column', () => {
    render(<GanttChart activities={ACTIVITIES} />);
    const site = screen.getAllByText('Site establishment');
    const earthworks = screen.getAllByText('Earthworks');
    expect(site.length).toBeGreaterThan(0);
    expect(earthworks.length).toBeGreaterThan(0);
  });

  it('calls onActivityClick when an activity row is clicked', () => {
    const handleClick = vi.fn();
    render(<GanttChart activities={ACTIVITIES} onActivityClick={handleClick} />);

    const [button] = screen.getAllByRole('button', { name: 'Site establishment' });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledWith('1');
  });
});

