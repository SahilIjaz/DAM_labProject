import type { NextApiRequest, NextApiResponse } from 'next';
import { cacheInvalidationService } from '@/lib/services/cache-invalidation.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = await cacheInvalidationService.getQueueStats();
    return res.status(200).json({
      status: 'ok',
      service: 'cache-invalidation',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting cache invalidation status:', error);
    return res.status(500).json({
      error: 'Failed to get cache invalidation status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
