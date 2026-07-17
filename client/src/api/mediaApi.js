import apiClient from './client.js';

export const mediaApi = {
  list: (params) => apiClient.get('/media', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/media/${id}`).then((r) => r.data),
  update: (id, body) => apiClient.patch(`/media/${id}`, body).then((r) => r.data),
  assignTags: (id, tags) => apiClient.patch(`/media/${id}/tags`, { tags }).then((r) => r.data),
  move: (id, folderId) => apiClient.patch(`/media/${id}/move`, { folderId }).then((r) => r.data),
  toggleFavorite: (id) => apiClient.post(`/media/${id}/favorite`).then((r) => r.data),
  listFavorites: (params) => apiClient.get('/media/favorites', { params }).then((r) => r.data),
  getUsage: (id) => apiClient.get(`/media/${id}/usage`).then((r) => r.data),
  remove: (id, force = false) => apiClient.delete(`/media/${id}`, { params: { force } }).then((r) => r.data),
  restore: (id) => apiClient.post(`/media/${id}/restore`).then((r) => r.data),
  permanentlyDelete: (id) => apiClient.delete(`/media/${id}/permanent`).then((r) => r.data),
  replaceFile: (id, file, onUploadProgress) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .put(`/media/${id}/replace`, form, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress })
      .then((r) => r.data);
  },
  listVersions: (id) => apiClient.get(`/media/${id}/versions`).then((r) => r.data),
  restoreVersion: (id, versionNumber) => apiClient.post(`/media/${id}/versions/${versionNumber}/restore`).then((r) => r.data),

  bulkDelete: (ids, force = false) => apiClient.post('/media/bulk/delete', { ids, force }).then((r) => r.data),
  bulkRestore: (ids) => apiClient.post('/media/bulk/restore', { ids }).then((r) => r.data),
  bulkMove: (ids, folderId) => apiClient.post('/media/bulk/move', { ids, folderId }).then((r) => r.data),
  bulkAssignTags: (ids, tags) => apiClient.post('/media/bulk/tags', { ids, tags }).then((r) => r.data),
  bulkArchive: (ids, archive = true) => apiClient.post('/media/bulk/archive', { ids, archive }).then((r) => r.data),
  bulkExportMetadata: (ids) => apiClient.post('/media/bulk/export-metadata', { ids }).then((r) => r.data),
};

export default mediaApi;
