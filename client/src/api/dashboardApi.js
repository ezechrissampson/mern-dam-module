import apiClient from './client.js';

export const dashboardApi = {
  stats: () => apiClient.get('/dashboard/stats').then((r) => r.data),
  storageChart: () => apiClient.get('/dashboard/storage-chart').then((r) => r.data),
};

export default dashboardApi;
