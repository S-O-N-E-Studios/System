import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '@/api/tenants';

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.list(),
  });
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: () => tenantsApi.getById(id!),
    enabled: !!id,
  });
}

export function useSuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.suspend(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useReactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.reactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}
