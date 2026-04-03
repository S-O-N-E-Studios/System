import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, GripVertical } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '@/types';
import Modal from '@/components/ui/Modal';
import { useUiStore } from '@/store/uiStore';

import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

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

function getColumnDroppableId(status: TaskStatus) {
  return `kanban-column:${status}`;
}

function TaskCard({
  task,
  isDone,
  onOpenDetails,
}: {
  task: KanbanTask;
  isDone: boolean;
  onOpenDetails: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenDetails(task.id);
      }}
      className={[
        'bg-[var(--bg-secondary)] border border-[var(--border)] p-4 cursor-pointer',
        'hover:border-[var(--accent)] hover:shadow-lg transition-all duration-300',
        priorityBorder[task.priority],
        isDone ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p
          className={[
            'text-[0.78rem] font-body font-normal text-[var(--text-primary)]',
            isDone ? 'line-through' : '',
          ].join(' ')}
        >
          {task.title}
        </p>

        <GripVertical
          className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 cursor-grab"
          {...attributes}
          {...listeners}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Drag task"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={task.assignee} size="sm" />
          <span className="text-[0.55rem] text-[var(--text-muted)]">{task.assignee}</span>
        </div>
        <span className="text-[0.55rem] text-[var(--text-muted)]">{task.dueDate}</span>
      </div>

      <div className="mt-2">
        <StatusBadge
          status={
            task.priority === 'critical'
              ? 'danger'
              : task.priority === 'high'
                ? 'review'
                : task.priority === 'medium'
                  ? 'planning'
                  : 'accent'
          }
        >
          {task.priority}
        </StatusBadge>
      </div>
    </div>
  );
}

function KanbanColumn({
  col,
  colTasks,
  onAddTask,
  onOpenDetails,
}: {
  col: { key: TaskStatus; label: string; color: string };
  colTasks: KanbanTask[];
  onAddTask: (status: TaskStatus) => void;
  onOpenDetails: (taskId: string) => void;
}) {
  const isDone = col.key === 'done';
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnDroppableId(col.key),
  });

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

        <button
          type="button"
          onClick={() => onAddTask(col.key)}
          className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          aria-label={`Add task to ${col.label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards */}
      <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={[
            'flex flex-col gap-2',
            isOver ? 'bg-[var(--accent-glow)]/20' : '',
          ].join(' ')}
        >
          {colTasks.length === 0 && (
            <p className="text-[0.7rem] text-[var(--text-muted)] py-4 text-center">No tasks</p>
          )}

          {colTasks.map((task) => (
            <TaskCard key={task.id} task={task} isDone={isDone} onOpenDetails={onOpenDetails} />
          ))}

          {/* Add card at bottom */}
          <button
            type="button"
            onClick={() => onAddTask(col.key)}
            className="border border-dashed border-[var(--border)] p-3 text-[0.7rem] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-center"
          >
            + Add Task
          </button>
        </div>
      </SortableContext>
    </div>
  );
}

function AddTaskModal({ onAddTask }: { onAddTask: (task: KanbanTask) => void }) {
  const { modalData, closeModal } = useUiStore();

  const initialStatus =
    modalData && typeof modalData === 'object' && 'status' in modalData
      ? (modalData as { status?: TaskStatus }).status ?? null
      : null;

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus ?? 'backlog');

  // When the modal opens for a different column, sync the default status.
  useEffect(() => {
    setStatus(initialStatus ?? 'backlog');
  }, [initialStatus]);

  return (
    <Modal modalId="kanban-task-add" title="Add Task" size="lg">
      <div className="px-8 pb-6 space-y-4">
        <div className="space-y-1">
          <label className="text-body text-[0.75rem] text-[var(--text-muted)]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-[0.85rem] focus:border-[var(--accent)] focus:outline-none"
            placeholder="e.g. Prepare tender documents"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-body text-[0.75rem] text-[var(--text-muted)]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-[0.85rem] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-body text-[0.75rem] text-[var(--text-muted)]">Due date</label>
            <input
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-[0.85rem] focus:border-[var(--accent)] focus:outline-none"
              placeholder="e.g. 10 Mar 2026"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-body text-[0.75rem] text-[var(--text-muted)]">Assignee</label>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-[0.85rem] focus:border-[var(--accent)] focus:outline-none"
              placeholder="e.g. Lerato K."
            />
          </div>
          <div className="space-y-1">
            <label className="text-body text-[0.75rem] text-[var(--text-muted)]">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-[0.85rem] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button variant="ghost" onClick={() => closeModal()}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!title.trim()) return;

              onAddTask({
                id: crypto.randomUUID(),
                title: title.trim(),
                priority,
                assignee: assignee.trim() || 'Unassigned',
                dueDate: dueDate.trim() || '—',
                status,
              });
              closeModal();
            }}
          >
            Add Task
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TaskDetailsModal({ tasks }: { tasks: KanbanTask[] }) {
  const { modalData } = useUiStore();

  const taskId =
    modalData && typeof modalData === 'object' && 'taskId' in modalData
      ? (modalData as { taskId?: string }).taskId ?? null
      : null;

  const task = useMemo(() => (taskId ? tasks.find((t) => t.id === taskId) ?? null : null), [taskId, tasks]);
  const isDone = task?.status === 'done';

  return (
    <Modal modalId="kanban-task-details" title="Task Details" size="lg">
      <div className="px-8 pb-6 space-y-4">
        {!task ? (
          <p className="text-body text-[var(--text-muted)]">Task not found.</p>
        ) : (
          <>
            <div>
              <h2 className="text-h2">{task.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge status={task.priority === 'critical' ? 'danger' : task.priority === 'high' ? 'review' : task.priority === 'medium' ? 'planning' : 'accent'}>
                  {task.priority}
                </StatusBadge>
                <span className="text-[0.75rem] text-[var(--text-muted)] uppercase tracking-wider">
                  {task.status.replace('_', ' ')}
                </span>
                <span className="text-[0.75rem] text-[var(--text-muted)]">{task.dueDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)]">
                <p className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wider mb-2">Assignee</p>
                <div className="flex items-center gap-3">
                  <Avatar name={task.assignee} size="md" />
                  <p className="text-[0.92rem] text-[var(--text-primary)]">{task.assignee}</p>
                </div>
              </div>
              <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)]">
                <p className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wider mb-2">Status</p>
                <p className="text-[0.92rem] text-[var(--text-primary)]">
                  {task.status === 'backlog'
                    ? 'Backlog'
                    : task.status === 'in_progress'
                      ? 'In Progress'
                      : task.status === 'in_review'
                        ? 'In Review'
                        : 'Done'}
                </p>
              </div>
            </div>

            {isDone && (
              <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)]">
                <p className="text-body text-[var(--text-muted)]">
                  This task is marked as done. Drag it to another column if needed.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

export default function Kanban() {
  const [tasks, setTasks] = useState<KanbanTask[]>(mockTasks);
  const { openModal } = useUiStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const overTask = tasks.find((t) => t.id === overId);
    let nextStatus: TaskStatus | null = null;

    if (overTask) {
      nextStatus = overTask.status;
    } else if (overId.startsWith('kanban-column:')) {
      nextStatus = overId.replace('kanban-column:', '') as TaskStatus;
    }

    if (!nextStatus || nextStatus === activeTask.status) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, status: nextStatus as TaskStatus } : t))
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Kanban Board</h1>
        <div className="flex items-center gap-3">
          <select className="bg-transparent border border-[var(--border)] px-3 py-2 text-[0.78rem] font-body text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none">
            <option className="bg-[var(--bg-card)]">Sprint 4: 23 Mar to 3 Apr</option>
            <option className="bg-[var(--bg-card)]">Sprint 3: 9 to 20 Mar</option>
          </select>
          <Button
            variant="primary"
            onClick={() => openModal('kanban-task-add', { status: 'backlog' })}
          >
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <KanbanColumn
                key={col.key}
                col={col}
                colTasks={colTasks}
                onAddTask={(status) => openModal('kanban-task-add', { status })}
                onOpenDetails={(taskId) =>
                  openModal('kanban-task-details', { taskId })
                }
              />
            );
          })}
        </div>
      </DndContext>
      )}

      <AddTaskModal
        onAddTask={(task) => {
          setTasks((prev) => [task, ...prev]);
        }}
      />
      <TaskDetailsModal tasks={tasks} />
    </div>
  );
}
