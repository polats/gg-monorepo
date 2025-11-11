/**
 * MongoDB Connection
 * 
 * Singleton connection pool for Next.js API routes
 */

import mongoose from 'mongoose';
import { CONFIG } from '@/config/constants';

/**
 * Cached connection for serverless environments
 */
interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: CachedConnection | undefined;
  // eslint-disable-next-line no-var
  var dbInitLogged: boolean | undefined;
}

let cached: CachedConnection = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// Log database configuration on startup (only once)
if (!global.dbInitLogged) {
  if (CONFIG.MOCK_MODE) {
    console.log('🧪 MOCK MODE: Using file-based persistence');
  } else if (CONFIG.MONGODB_URI) {
    console.log('✅ Database configured');
  } else {
    console.warn('⚠️  MONGODB_URI not configured!');
  }
  global.dbInitLogged = true;
}

/**
 * Connect to MongoDB
 * 
 * Uses cached connection in serverless environments
 * 
 * @returns Promise<typeof mongoose> - Mongoose instance
 */
async function connectDB(): Promise<typeof mongoose> {
  // Return cached connection if exists
  if (cached.conn) {
    return cached.conn;
  }

  // Return pending connection promise if exists
  if (cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  // Check for MongoDB URI
  if (!CONFIG.MONGODB_URI) {
    throw new Error('MONGODB_URI not configured in environment variables');
  }

  // Create new connection
  cached.promise = mongoose.connect(CONFIG.MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
  }).then((mongoose) => {
    console.log('✅ Database connected');
    return mongoose;
  }).catch((error) => {
    console.error('❌ Database connection error:', error.message);
    cached.promise = null;
    throw error;
  });

  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Disconnect from MongoDB
 * 
 * Only use in development or cleanup scripts
 */
async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('✅ Database disconnected');
  }
}

/**
 * Check if MongoDB is connected
 * 
 * @returns boolean - True if connected
 */
function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// Export functions
export { connectDB, disconnectDB, isConnected };
export default connectDB;
