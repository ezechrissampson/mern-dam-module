import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from './authController.js';
import { standaloneAuthenticate } from './authMiddleware.js';
import validateRequest from '../validators/validateRequest.js';
import { registerBody, loginBody } from './validators.js';

const router = Router();

// Stricter limiter on auth endpoints — these are the most common brute-force target.
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' },
});

router.post('/register', authRateLimiter, registerBody, validateRequest, authController.register);
router.post('/login', authRateLimiter, loginBody, validateRequest, authController.login);
router.get('/me', standaloneAuthenticate, authController.me);

export default router;
