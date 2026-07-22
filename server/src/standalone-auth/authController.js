import asyncHandler from '../middlewares/asyncHandler.js';
import sendSuccess from '../utils/responseFormatter.js';
import authService from './authService.js';

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  sendSuccess(res, { statusCode: 201, data: { user, token }, message: 'Account created.' });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  sendSuccess(res, { data: { user, token }, message: 'Logged in.' });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: req.user });
});
