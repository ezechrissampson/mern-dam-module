import apiClient from './client.js';

export const uploadApi = {
  single: (file, meta = {}, onUploadProgress) => {
    const form = new FormData();
    form.append('file', file);
    Object.entries(meta).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value);
    });
    return apiClient
      .post('/uploads/single', form, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress })
      .then((r) => r.data);
  },
  multiple: (files, meta = {}, onUploadProgress) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    Object.entries(meta).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value);
    });
    return apiClient
      .post('/uploads/multiple', form, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress })
      .then((r) => r.data);
  },
};

export default uploadApi;
