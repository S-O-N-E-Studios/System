import apiClient from './client';
import type { ScheduleActivity, ApiResponse } from '@/types';

export const activitiesApi = {
  listByProject: async (projectId: string): Promise<ScheduleActivity[]> => {
    const res = await apiClient.get<ApiResponse<ScheduleActivity[]>>(
      `/projects/${projectId}/activities`
    );
    return res.data.data;
  },
};
