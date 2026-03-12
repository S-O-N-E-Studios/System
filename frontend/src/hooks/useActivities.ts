import { useQuery } from '@tanstack/react-query';
import { activitiesApi } from '@/api/activities';

export function useActivities(projectId: string | undefined) {
  return useQuery({
    queryKey: ['activities', projectId],
    queryFn: () => activitiesApi.listByProject(projectId!),
    enabled: !!projectId,
  });
}
