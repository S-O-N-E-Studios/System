import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, sprintsApi } from '@/api/tasks';

export function useTasks(sprintId?: string) {
  return useQuery({
    queryKey: ['tasks', sprintId],
    queryFn: () => tasksApi.list(sprintId),
  });
}

export function useSprints() {
  return useQuery({
    queryKey: ['sprints'],
    queryFn: () => sprintsApi.list(),
  });
}

export function useActiveSprint() {
  return useQuery({
    queryKey: ['sprints', 'active'],
    queryFn: () => sprintsApi.getActive(),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
