import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  // Get the current user's username (the post creator)
  const creatorUsername = await reddit.getCurrentUsername();
  const displayName = creatorUsername ?? 'anonymous';

  return await reddit.submitCustomPost({
    splash: {
      // Splash Screen Configuration
      appDisplayName: 'goblin-gardens',
      backgroundUri: 'gg-splash.png',
      buttonLabel: 'Tap to Start',
      description: `Scrounge, Grow, Trade`,
      entryUri: 'index.html',
      heading: `Welcome to Goblin Gardens!`,
      appIconUri: 'diamond-icon.png',
    },
    postData: {
      gameState: 'initial',
      score: 0,
    },
    subredditName: subredditName,
    title: `goblin-gardens by u/${displayName}`,
  });
};
