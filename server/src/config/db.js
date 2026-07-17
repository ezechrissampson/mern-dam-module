import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

mongoose.set('strictQuery', true);

/**
 * Connects to MongoDB. Designed to be called once from server.js.
 * If this module is mounted into an existing app that already owns
 * its own mongoose connection, call `registerModels()` instead and
 * skip `connectDB()` entirely — see README > Integration Guide.
 */
export async function connectDB() {
  mongoose.connection.on('connected', () => {
    logger.info('[db] MongoDB connection established');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`[db] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('[db] MongoDB disconnected');
  });

  await mongoose.connect(env.mongoUri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export default mongoose;
