import apiClient from './client.js';

export const folderApi = {
  tree: (rootId) => apiClient.get('/folders/tree', { params: { rootId } }).then((r) => r.data),
  breadcrumb: (id) => apiClient.get(`/folders/${id}/breadcrumb`).then((r) => r.data),
  create: (body) => apiClient.post('/folders', body).then((r) => r.data),
  rename: (id, name) => apiClient.patch(`/folders/${id}/rename`, { name }).then((r) => r.data),
  move: (id, parentId) => apiClient.patch(`/folders/${id}/move`, { parentId }).then((r) => r.data),
  toggleFavorite: (id) => apiClient.post(`/folders/${id}/favorite`).then((r) => r.data),
  remove: (id, cascade = false) => apiClient.delete(`/folders/${id}`, { params: { cascade } }).then((r) => r.data),
};

export default folderApi;
