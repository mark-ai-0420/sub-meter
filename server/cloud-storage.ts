import { Redis } from '@upstash/redis';

export const STORAGE_KEY = 'submeter:app_data';
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export function isAppData(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return ['units', 'meters', 'billingCycles'].every((key) =>
    Array.isArray(data[key]) && data[key].every((item: unknown) =>
      !!item && typeof item === 'object' && typeof (item as Record<string, unknown>).id === 'string'))
    && !!data.landlordInfo && typeof data.landlordInfo === 'object'
    && (data.activeCycleId === null || typeof data.activeCycleId === 'string');
}

export async function handleStorageRequest(
  method: string | undefined,
  body: unknown,
  env: Record<string, string | undefined>,
  backup?: (data: Record<string, unknown>) => Promise<void>,
  readBackup?: () => Promise<Record<string, unknown> | null>,
) {
  if (method === 'OPTIONS') return { status: 204, body: null };
  if (method !== 'GET' && method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }
  if (method === 'POST' && !isAppData(body)) {
    return { status: 400, body: { error: 'Invalid app data' } };
  }
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  const hasRealRedis = !!(
    url &&
    token &&
    token !== '[SENSITIVE]' &&
    url !== '[SENSITIVE]' &&
    url.startsWith('https://')
  );

  if (!hasRealRedis) {
    if (readBackup && method === 'GET') {
      const data = await readBackup().catch(() => null);
      if (data === null) return { status: 200, body: { exists: false } };
      if (!isAppData(data)) return { status: 502, body: { error: 'Invalid local data' } };
      return { status: 200, body: { exists: true, data } };
    }
    if (backup && method === 'POST') {
      await backup(body as Record<string, unknown>).catch(() => null);
      return { status: 200, body: { success: true } };
    }
    return { status: 503, body: { error: 'Cloud storage is not configured' } };
  }

  try {
    const redis = new Redis({ url, token });
    if (method === 'GET') {
      const data = await redis.get(STORAGE_KEY);
      if (data === null) {
        if (readBackup) {
          const fallback = await readBackup().catch(() => null);
          if (fallback && isAppData(fallback)) return { status: 200, body: { exists: true, data: fallback } };
        }
        return { status: 200, body: { exists: false } };
      }
      if (!isAppData(data)) return { status: 502, body: { error: 'Invalid cloud data' } };
      await backup?.(data).catch(() => console.warn('[Cloud] Local backup could not be saved'));
      return { status: 200, body: { exists: true, data } };
    }
    await redis.set(STORAGE_KEY, body);
    await backup?.(body as Record<string, unknown>).catch(() => console.warn('[Cloud] Local backup could not be saved'));
    return { status: 200, body: { success: true } };
  } catch {
    if (readBackup && method === 'GET') {
      const fallback = await readBackup().catch(() => null);
      if (fallback && isAppData(fallback)) return { status: 200, body: { exists: true, data: fallback } };
    }
    if (backup && method === 'POST') {
      await backup(body as Record<string, unknown>).catch(() => null);
      return { status: 200, body: { success: true } };
    }
    return { status: 502, body: { error: 'Cloud storage is unavailable' } };
  }
}
