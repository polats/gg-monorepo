import express, { Express } from 'express';
import cors from 'cors';
import { detectEnvironment, Environment } from './adapters/environment';
import { createRedisAdapter } from './adapters/redis-adapter';
import { createAuthAdapter } from './adapters/auth-adapter';
import { createRoutes } from './core/routes';

let app: Express | null = null;

function getApp(): Express {
  if (!app) {
    try {
      console.log('[Vercel] Initializing Express app...');
      app = express();

      // Middleware
      app.use(cors());
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(express.text());

      // Initialize adapters
      console.log('[Vercel] Detecting environment...');
      const environment = detectEnvironment();
      console.log('[Vercel] Environment detected:', environment);

      if (environment !== Environment.VERCEL) {
        console.warn('Warning: vercel.ts should only run on Vercel');
      }

      console.log('[Vercel] Creating adapters...');
      const redis = createRedisAdapter(environment);
      const auth = createAuthAdapter(environment);

      // Create routes with context (no postId for Vercel mode)
      console.log('[Vercel] Creating routes...');
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
        console.error('[Vercel] Error:', err);
        res.status(500).json({
          status: 'error',
          message: err.message || 'Internal server error',
        });
      });

      console.log('[Vercel] App initialized successfully');
    } catch (error) {
      console.error('[Vercel] Failed to initialize app:', error);
      throw error;
    }
  }

  return app;
}

// Export for Vercel
export default getApp();
