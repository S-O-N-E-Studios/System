import { useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, GripVertical } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '@/types';

interface KanbanTask {
  id: string;
  title: string;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
}

const columns: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'var(--text-muted)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--status-active)' },
  { key: 'in_review', label: 'In Review', color: 'var(--status-review)' },
  { key: 'done', label: 'Done', color: 'var(--status-done)' },
];

const mockTasks: KanbanTask[] = [
  { id: '1', title: 'Compile monthly progress report', priority: 'high', assignee: 'Fortune M.', dueDate: '3 Mar 2026', status: 'backlog' },
  { id: '2', title: 'Review geo-tech borehole logs', priority: 'medium', assignee: 'Thabo N.', dueDate: '7 Mar 2026', status: 'backlog' },
  { id: '3', title: 'Update construction schedule', priority: 'critical', assignee: 'Fortune M.', dueDate: '5 Mar 2026', status: 'in_progress' },
  { id: '4', title: 'Prepare tender documents', priority: 'high', assignee: 'Lerato K.', dueDate: '10 Mar 2026', status: 'in_progress' },
  { id: '5', title: 'Submit variation order #3', priority: 'medium', assignee: 'Thabo N.', dueDate: '8 Mar 2026', status: 'in_review' },
  { id: '6', title: 'Upload site inspection photos', priority: 'low', assignee: 'Sipho D.', dueDate: '1 Mar 2026', status: 'done' },
  { id: '7', title: 'Complete DDR initial draft', priority: 'high', assignee: 'Lerato K.', dueDate: '28 Feb 2026', status: 'done' },
];

const priorityBorder: Record<TaskPriority, string> = {
  critical: 'border-l-[3px] border-l-[var(--status-danger)]',
  high: 'border-l-[3px] border-l-[var(--status-review)]',
  medium: '',
  low: 'opacity-80',
};

export default function Kanban() {
  const [tasks] = useState(mockTasks);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Kanban Board</h1>
        <div className="flex items-center gap-3">
          <select className="bg-transparent border border-[var(--border)] px-3 py-2 text-[0.78rem] font-body text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none">
            <option className="bg-[var(--bg-card)]">Sprint 4 — 23 Mar – 3 Apr</option>
            <option className="bg-[var(--bg-card)]">Sprint 3 — 9 – 20 Mar</option>
          </select>
          <Button variant="primary">
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Board */}
      {tasks.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
          <EmptyState
            title="No tasks on this board yet."
            description="Add a task or switch to another sprint."
          />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          const isDone = col.key === 'done';

          return (
            <div key={col.key} className="flex flex-col">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-4 py-3 mb-3 border-b-2"
                style={{
                  borderBottomColor: col.color,
                  borderLeftWidth: col.key === 'in_progress' ? '2px' : '0',
                  borderLeftColor: 'var(--accent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-eyebrow">{col.label}</h3>
                  <span className="text-[0.55rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>
                <button className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {colTasks.length === 0 && (
                  <p className="text-[0.7rem] text-[var(--text-muted)] py-4 text-center">No tasks</p>
                )}
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className={[
                      'bg-[var(--bg-secondary)] border border-[var(--border)] p-4 cursor-pointer',
                      'hover:border-[var(--accent)] hover:shadow-lg transition-all duration-300',
                      priorityBorder[task.priority],
                      isDone ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className={[
                        'text-[0.78rem] font-body font-normal text-[var(--text-primary)]',
                        isDone ? 'line-through' : '',
                      ].join(' ')}>
                        {task.title}
                      </p>
                      <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 cursor-grab" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={task.assignee} size="sm" />
                        <span className="text-[0.55rem] text-[var(--text-muted)]">{task.assignee}</span>
                      </div>
                      <span className="text-[0.55rem] text-[var(--text-muted)]">{task.dueDate}</span>
                    </div>
                    <div className="mt-2">
                      <StatusBadge status={
                        task.priority === 'critical' ? 'danger' :
                        task.priority === 'high' ? 'review' :
                        task.priority === 'medium' ? 'planning' : 'accent'
                      }>
                        {task.priority}
                      </StatusBadge>
                    </div>
                  </div>
                ))}

                {/* Add card at bottom */}
                <button className="border border-dashed border-[var(--border)] p-3 text-[0.7rem] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-center">
                  + Add Task
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <p className="text-[0.65rem] text-[var(--text-muted)] mt-8 text-center">
        Drag-and-drop with @dnd-kit will be wired in Sprint 5.
      </p>
    </div>
  );
}
