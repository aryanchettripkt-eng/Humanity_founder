import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function connectDB(uri = env.MONGODB_URI) {
  if (uri.startsWith('mongodb+srv://') && env.NODE_ENV === 'development') {
    // Some local/ISP DNS resolvers refuse SRV lookups required by mongodb+srv://
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info('MongoDB connected');
  return mongoose.connection;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
}

