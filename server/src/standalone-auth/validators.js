import { body } from 'express-validator';

export const registerBody = [
  body('name').isString().trim().isLength({ min: 1, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
];

export const loginBody = [body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty()];
