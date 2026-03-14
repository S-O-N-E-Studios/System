import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import type { Project } from '@/types';

interface ProjectListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useProjects(params?: ProjectListParams) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsApi.list(params),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) => projectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) => projectsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useProjectPayments(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-payments', projectId],
    queryFn: () => projectsApi.getPayments(projectId!),
    enabled: !!projectId,
  });
}

export function useProjectActivities(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-activities', projectId],
    queryFn: () => projectsApi.getActivities(projectId!),
    enabled: !!projectId,
  });
}

export function useProjectPaymentForecast(projectId: string | undefined, year?: number) {
  return useQuery({
    queryKey: ['payment-forecast', projectId, year],
    queryFn: () => projectsApi.getPaymentForecast(projectId!, year),
    enabled: !!projectId,
  });
}

export function useCreatePayment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => projectsApi.createPayment(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-payments', projectId] });
    },
  });
}

export function useCreateActivity(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => projectsApi.createActivity(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-activities', projectId] });
    },
  });
}
