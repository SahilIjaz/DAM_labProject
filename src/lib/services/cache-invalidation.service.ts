import { cacheDelete, cacheClear } from '../db/redis';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'university_main',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

interface CacheInvalidationEvent {
  queue_id: number;
  cache_key: string;
  event_type: 'delete' | 'invalidate';
  table_name: string;
  record_id: number;
  created_at: Date;
  processed: boolean;
}

class CacheInvalidationService {
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Cache invalidation service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting cache invalidation service...');

    // Start polling for cache invalidation events
    this.pollInterval = setInterval(() => this.processInvalidationQueue(), 1000); // Poll every 1 second

    // Process any pending events on startup
    await this.processInvalidationQueue();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    await pool.end();
    console.log('Cache invalidation service stopped');
  }

  private async processInvalidationQueue(): Promise<void> {
    try {
      const connection = await pool.getConnection();

      const [rows] = await connection.execute<CacheInvalidationEvent[]>(
        `SELECT * FROM cache_invalidation_queue
         WHERE processed = FALSE
         ORDER BY created_at ASC
         LIMIT 100`
      );

      if (rows.length === 0) {
        connection.release();
        return;
      }

      // Process each event
      for (const event of rows) {
        try {
          await this.handleInvalidationEvent(event);

          // Mark as processed
          await connection.execute(
            `UPDATE cache_invalidation_queue
             SET processed = TRUE, processed_at = NOW()
             WHERE queue_id = ?`,
            [event.queue_id]
          );
        } catch (error) {
          console.error(`Failed to process invalidation event ${event.queue_id}:`, error);
        }
      }

      connection.release();
    } catch (error) {
      console.error('Error processing cache invalidation queue:', error);
    }
  }

  private async handleInvalidationEvent(event: CacheInvalidationEvent): Promise<void> {
    const { cache_key, event_type, table_name, record_id } = event;

    console.log(
      `[Cache Invalidation] ${event_type.toUpperCase()}: ${cache_key} (${table_name}:${record_id})`
    );

    if (event_type === 'delete') {
      // Direct delete of specific key
      await cacheDelete(cache_key);
    } else if (event_type === 'invalidate') {
      // Pattern-based invalidation (e.g., "users:*")
      await cacheClear(cache_key);
    }
  }

  async getQueueStats(): Promise<{
    pending: number;
    processed: number;
    total: number;
  }> {
    try {
      const connection = await pool.getConnection();

      const [[{ pending }], [{ processed }], [{ total }]] = await Promise.all([
        connection.execute<[{ pending: number }]>(
          'SELECT COUNT(*) as pending FROM cache_invalidation_queue WHERE processed = FALSE'
        ),
        connection.execute<[{ processed: number }]>(
          'SELECT COUNT(*) as processed FROM cache_invalidation_queue WHERE processed = TRUE'
        ),
        connection.execute<[{ total: number }]>(
          'SELECT COUNT(*) as total FROM cache_invalidation_queue'
        ),
      ]);

      connection.release();

      return {
        pending: pending || 0,
        processed: processed || 0,
        total: total || 0,
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { pending: 0, processed: 0, total: 0 };
    }
  }

  async clearProcessedEvents(daysOld: number = 7): Promise<number> {
    try {
      const connection = await pool.getConnection();

      const [result] = await connection.execute(
        `DELETE FROM cache_invalidation_queue
         WHERE processed = TRUE
         AND processed_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysOld]
      );

      connection.release();

      const affectedRows = (result as any).affectedRows || 0;
      console.log(`Cleared ${affectedRows} old cache invalidation events`);
      return affectedRows;
    } catch (error) {
      console.error('Error clearing old invalidation events:', error);
      return 0;
    }
  }
}

export const cacheInvalidationService = new CacheInvalidationService();
