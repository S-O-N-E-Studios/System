import api from './api';

export const uploadFile = (formData) =>
  api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const downloadFile = (id) => api.get(`/files/${id}`, { responseType: 'blob' });
