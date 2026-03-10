import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '@/api/files';

interface FileListParams {
  projectId?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export function useFiles(params?: FileListParams) {
  return useQuery({
    queryKey: ['files', params],
    queryFn: () => filesApi.list(params),
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, projectId }: { file: File; projectId?: string }) =>
      filesApi.upload(file, projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => filesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useFileDownloadUrl(id: string) {
  return useQuery({
    queryKey: ['files', id, 'download'],
    queryFn: () => filesApi.getDownloadUrl(id),
    enabled: false,
  });
}
