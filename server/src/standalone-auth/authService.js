import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import StandaloneUser from './StandaloneUser.js';
import env from '../config/env.js';
import { ConflictError, UnauthenticatedError, ValidationError } from '../errors/AppError.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 12;

export async function register({ name, email, password }) {
  const existing = await StandaloneUser.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ConflictError('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await StandaloneUser.create({ name, email, passwordHash });
  return { user: user.toSafeJSON(), token: issueToken(user) };
}

export async function login({ email, password }) {
  const user = await StandaloneUser.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new UnauthenticatedError('Invalid email or password.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthenticatedError('Invalid email or password.');
  }

  return { user: user.toSafeJSON(), token: issueToken(user) };
}

export function issueToken(user) {
  return jwt.sign({ sub: String(user._id), email: user.email, roles: user.roles }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret); // throws on invalid/expired
}

/**
 * Ensures a default admin account exists so `npm run dev` works out of
 * the box in standalone mode without a separate seeding step. No-op if
 * an account with STANDALONE_ADMIN_EMAIL already exists (e.g. because
 * someone already changed the password through the app).
 */
export async function ensureDefaultAdmin() {
  const { email, password } = env.standaloneAdmin;
  const existing = await StandaloneUser.findOne({ email: email.toLowerCase() });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await StandaloneUser.create({ name: 'Standalone Admin', email, passwordHash, roles: ['admin'] });
  logger.info(`[standalone-auth] Created default admin account (${email}). Change STANDALONE_ADMIN_PASSWORD before any real deployment.`);
  return user;
}

export function assertPasswordStrength(password) {
  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long.');
  }
}

export default { register, login, issueToken, verifyToken, ensureDefaultAdmin, assertPasswordStrength };
