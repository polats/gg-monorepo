import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/server/vercel';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to Express-compatible format
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}
