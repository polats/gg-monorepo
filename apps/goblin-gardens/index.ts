import express from 'express';
import cors from 'cors';
import { detectEnvironment } from './src/server/adapters/environment.js';
import { createRedisAdapter } from './src/server/adapters/redis-adapter.js';
import { createAuthAdapter } from './src/server/adapters/auth-adapter.js';
import { createRoutes } from './src/server/core/routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Initialize adapters
const environment = detectEnvironment();
const redis = createRedisAdapter(environment);
const auth = createAuthAdapter(environment);

// Create routes
const routes = createRoutes({ redis, auth, postId: 'vercel-deployment' });
app.use(routes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[Error]:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

export default app;
