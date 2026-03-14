import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/ui/FormInput';
import { useTasks, useSprints, useCreateTask, useUpdateTaskStatus } from '@/hooks/useTasks';
import { Plus, GripVertical } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { useUiStore } from '@/store/uiStore';

const columns: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'var(--text-muted)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--status-active)' },
  { key: 'in_review', label: 'In Review', color: 'var(--status-review)' },
  { key: 'done', label: 'Done', color: 'var(--status-done)' },
];

const priorityBorder: Record<TaskPriority, string> = {
  critical: 'border-l-[3px] border-l-[var(--status-danger)]',
  high: 'border-l-[3px] border-l-[var(--status-review)]',
  medium: '',
  low: 'opacity-80',
};

interface SortableTaskCardProps {
  task: Task;
  isDone: boolean;
}

function SortableTaskCard({ task, isDone }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'bg-[var(--bg-secondary)] border border-[var(--border)] p-4 cursor-grab',
        'hover:border-[var(--accent)] hover:shadow-lg transition-all duration-300',
        priorityBorder[task.priority],
        isDone ? 'opacity-60' : '',
      ].join(' ')}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className={[
          'text-[0.78rem] font-body font-normal text-[var(--text-primary)]',
          isDone ? 'line-through' : '',
        ].join(' ')}>
          {task.title}
        </p>
        <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={task.assigneeName ?? '?'} size="sm" />
          <span className="text-[0.55rem] text-[var(--text-muted)]">{task.assigneeName ?? 'Unassigned'}</span>
        </div>
        <span className="text-[0.55rem] text-[var(--text-muted)]">
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}
        </span>
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
  );
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className={[
      'bg-[var(--bg-secondary)] border-2 border-[var(--accent)] p-4 shadow-2xl',
      priorityBorder[task.priority],
    ].join(' ')}>
      <p className="text-[0.78rem] font-body font-normal text-[var(--text-primary)]">{task.title}</p>
      <div className="flex items-center gap-2 mt-2">
        <Avatar name={task.assigneeName ?? '?'} size="sm" />
        <span className="text-[0.55rem] text-[var(--text-muted)]">{task.assigneeName ?? 'Unassigned'}</span>
      </div>
    </div>
  );
}

const CREATE_TASK_MODAL = 'create-task-modal';

export default function Kanban() {
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();
  const { data: tasksResponse, isLoading, error } = useTasks(selectedSprintId);
  const { data: sprints } = useSprints();
  const createTask = useCreateTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const { openModal, closeModal } = useUiStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTaskColumn, setNewTaskColumn] = useState<TaskStatus>('backlog');
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as TaskPriority });

  const tasks = useMemo(() => tasksResponse?.data ?? [], [tasksResponse?.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetColumn = columns.find((c) => c.key === overId);
    if (targetColumn) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetColumn.key) {
        updateTaskStatus.mutate({ id: taskId, status: targetColumn.key });
      }
      return;
    }

    const targetTask = tasks.find((t) => t.id === overId);
    if (targetTask) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetTask.status) {
        updateTaskStatus.mutate({ id: taskId, status: targetTask.status });
      }
    }
  }, [tasks, updateTaskStatus]);

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;
    createTask.mutate({
      title: newTask.title,
      description: newTask.description,
      status: newTaskColumn,
      priority: newTask.priority,
      sprintId: selectedSprintId,
    }, {
      onSuccess: () => {
        setNewTask({ title: '', description: '', priority: 'medium' });
        closeModal();
      },
    });
  };

  const openCreateTask = (column: TaskStatus) => {
    setNewTaskColumn(column);
    setNewTask({ title: '', description: '', priority: 'medium' });
    openModal(CREATE_TASK_MODAL);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] relative">
        <LoadingOverlay fullscreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-[0.82rem] text-[var(--status-danger)]">
          Failed to load tasks. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-h1">Kanban Board</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedSprintId ?? ''}
            onChange={(e) => setSelectedSprintId(e.target.value || undefined)}
            className="bg-transparent border border-[var(--border)] px-3 py-2 text-[0.78rem] font-body text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="" className="bg-[var(--bg-card)]">All Sprints</option>
            {(sprints ?? []).map((s) => (
              <option key={s.id} value={s.id} className="bg-[var(--bg-card)]">
                {s.name}{s.isActive ? ' (Active)' : ''}
              </option>
            ))}
          </select>
          <Button variant="primary" onClick={() => openCreateTask('backlog')}>
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        </div>
      </div>

      {tasks.length === 0 && !selectedSprintId ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)]">
          <EmptyState
            title="No tasks on this board yet."
            description="Create a task to get started."
          />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {columns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);
              const isDone = col.key === 'done';

              return (
                <div key={col.key} className="flex flex-col" id={col.key}>
                  <div
                    className="flex items-center justify-between px-4 py-3 mb-3 border-b-2"
                    style={{ borderBottomColor: col.color }}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-eyebrow">{col.label}</h3>
                      <span className="text-[0.55rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5">
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => openCreateTask(col.key)}
                      className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                      data-testid={`add-task-${col.key}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <SortableContext
                    id={col.key}
                    items={colTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2 min-h-[100px]" data-column={col.key}>
                      {colTasks.length === 0 && (
                        <div
                          className="border border-dashed border-[var(--border)] p-6 text-center text-[0.7rem] text-[var(--text-muted)]"
                          id={col.key}
                        >
                          Drop tasks here
                        </div>
                      )}
                      {colTasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} isDone={isDone} />
                      ))}
                    </div>
                  </SortableContext>

                  <button
                    onClick={() => openCreateTask(col.key)}
                    className="border border-dashed border-[var(--border)] p-3 mt-2 text-[0.7rem] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-center"
                  >
                    + Add Task
                  </button>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal
        modalId={CREATE_TASK_MODAL}
        title={`New Task — ${columns.find((c) => c.key === newTaskColumn)?.label ?? ''}`}
        onClose={closeModal}
      >
        <div className="space-y-4">
          <FormInput
            label="Task Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Enter task title"
            autoFocus
            data-testid="task-title-input"
          />
          <div>
            <label className="text-eyebrow block mb-2">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
              className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-[0.82rem] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-eyebrow block mb-2">Priority</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
              className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-[0.82rem] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="low" className="bg-[var(--bg-card)]">Low</option>
              <option value="medium" className="bg-[var(--bg-card)]">Medium</option>
              <option value="high" className="bg-[var(--bg-card)]">High</option>
              <option value="critical" className="bg-[var(--bg-card)]">Critical</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCreateTask}
              disabled={!newTask.title.trim() || createTask.isPending}
            >
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
