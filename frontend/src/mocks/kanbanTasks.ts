import type { TaskPriority, TaskStatus } from '@/types';

export type MockKanbanTask = {
  id: string;
  title: string;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
};

export const MOCK_KANBAN_TASKS: MockKanbanTask[] = [
  { id: '1', title: 'Compile monthly progress report', priority: 'high', assignee: 'Fortune M.', dueDate: '3 Mar 2026', status: 'backlog' },
  { id: '2', title: 'Review geo-tech borehole logs', priority: 'medium', assignee: 'Thabo N.', dueDate: '7 Mar 2026', status: 'backlog' },
  { id: '3', title: 'Update construction schedule', priority: 'critical', assignee: 'Fortune M.', dueDate: '5 Mar 2026', status: 'in_progress' },
  { id: '4', title: 'Prepare tender documents', priority: 'high', assignee: 'Lerato K.', dueDate: '10 Mar 2026', status: 'in_progress' },
  { id: '5', title: 'Submit variation order #3', priority: 'medium', assignee: 'Thabo N.', dueDate: '8 Mar 2026', status: 'in_review' },
  { id: '6', title: 'Upload site inspection photos', priority: 'low', assignee: 'Sipho D.', dueDate: '1 Mar 2026', status: 'done' },
  { id: '7', title: 'Complete DDR initial draft', priority: 'high', assignee: 'Lerato K.', dueDate: '28 Feb 2026', status: 'done' },
];
