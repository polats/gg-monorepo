import express from 'express';
import { createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { detectEnvironment, Environment } from './adapters/environment';
import { createRedisAdapter } from './adapters/redis-adapter';
import { createAuthAdapter } from './adapters/auth-adapter';
import { createRoutes } from './core/routes';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// Initialize adapters
const environment = detectEnvironment();

if (environment !== Environment.REDDIT) {
  console.warn('Warning: index.ts should only run on Reddit/Devvit');
}

const redis = createRedisAdapter(environment);
const auth = createAuthAdapter(environment);

// Create routes with context
const routes = createRoutes({ redis, auth, postId: context.postId });
app.use(routes);

// Devvit-specific internal routes (not in shared routes)
const router = express.Router();

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

app.use(router);

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(getServerPort());
