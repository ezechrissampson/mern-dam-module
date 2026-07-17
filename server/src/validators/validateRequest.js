import { validationResult } from 'express-validator';
import { ValidationError } from '../errors/AppError.js';

/** Runs after express-validator chains; throws a formatted ValidationError on failure. */
export function validateRequest(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new ValidationError('One or more fields are invalid.', details));
  }
  return next();
}

export default validateRequest;
