import apiClient from './client.js';

export const activityApi = {
  list: (params) => apiClient.get('/activity', { params }).then((r) => r.data),
};

export default activityApi;
