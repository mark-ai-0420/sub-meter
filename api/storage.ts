import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsHeaders, handleStorageRequest } from '../server/cloud-storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  for (const [key, value] of Object.entries(corsHeaders)) res.setHeader(key, value);
  res.setHeader('Allow', 'GET, POST, OPTIONS');
  let body: unknown = req.body;
  if (req.method === 'POST' && typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const result = await handleStorageRequest(req.method, body, process.env);
  if (result.status === 204) return res.status(204).end();
  return res.status(result.status).json(result.body);
}
