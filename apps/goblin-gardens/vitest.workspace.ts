import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './src/client/vitest.config.ts',
  './src/server/vitest.config.ts',
]);
