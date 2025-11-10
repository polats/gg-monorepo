import express from 'express';
import cors from 'cors';
import { detectEnvironment, Environment } from './adapters/environment';
import { createRedisAdapter } from './adapters/redis-adapter';
import { createAuthAdapter } from './adapters/auth-adapter';
import { createRoutes } from './core/routes';

const app = express();

// Enable CORS for local development
app.use(cors());

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// Initialize adapters
const environment = detectEnvironment();

if (environment !== Environment.LOCAL) {
  console.warn('Warning: local.ts should only run in local development mode');
}

const redis = createRedisAdapter(environment);
const auth = createAuthAdapter(environment);

// Create routes with context (no postId for local mode)
const routes = createRoutes({ redis, auth, postId: 'mock-post-123' });
app.use(routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Local dev server running at http://localhost:${PORT}`);
  console.log(`   API endpoints available at http://localhost:${PORT}/api/*\n`);
});
