import express from 'express';
import cors from 'cors';
import { detectEnvironment, Environment } from './adapters/environment';
import { createRedisAdapter } from './adapters/redis-adapter';
import { createAuthAdapter } from './adapters/auth-adapter';
import { createRoutes } from './core/routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Initialize adapters
const environment = detectEnvironment();

if (environment !== Environment.VERCEL) {
  console.warn('Warning: vercel.ts should only run on Vercel');
}

const redis = createRedisAdapter(environment);
const auth = createAuthAdapter(environment);

// Create routes with context
const routes = createRoutes({ redis, auth });
app.use(routes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment });
});

// Export for Vercel
export default app;
