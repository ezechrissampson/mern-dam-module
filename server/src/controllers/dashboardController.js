import asyncHandler from '../middlewares/asyncHandler.js';
import sendSuccess from '../utils/responseFormatter.js';
import dashboardService from '../services/dashboardService.js';

export const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  sendSuccess(res, { data: stats });
});

export const getStorageChart = asyncHandler(async (req, res) => {
  const chart = await dashboardService.getStorageBreakdownChart();
  sendSuccess(res, { data: chart });
});
