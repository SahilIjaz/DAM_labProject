# Cache Invalidation via Triggers - Setup Guide

## Overview

This system automatically invalidates Redis cache whenever data changes in the database using MySQL triggers. No manual `cacheDelete()` calls needed!

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Data Change (INSERT/UPDATE/DELETE)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. MySQL Trigger Fires Automatically                        │
│    (defined in cache-invalidation-triggers.sql)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Trigger Inserts Event into                               │
│    cache_invalidation_queue Table                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CacheInvalidationService Polls Queue                     │
│    (runs every 1 second)                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Service Deletes/Invalidates from Redis                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Cache Stays in Sync with Database ✅                    │
└─────────────────────────────────────────────────────────────┘
```

## Setup Steps

### 1. Apply Triggers to Database

```bash
mysql -h localhost -u root -p university_main < database/mysql/cache-invalidation-triggers.sql
```

This creates:
- `cache_invalidation_queue` table (event queue)
- Triggers on all major tables (users, students, courses, enrollments, exam_results)

### 2. Update .env File

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=university_main
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Initialize Service in Your App

#### Option A: In `_app.tsx` (Next.js)

```typescript
import { useEffect } from 'react';
import { cacheInvalidationService } from '@/lib/services/cache-invalidation.service';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Start the cache invalidation service
    cacheInvalidationService.start();

    return () => {
      cacheInvalidationService.stop();
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

#### Option B: In API Route Handler

Create a serverless function that starts on first request:

```typescript
// pages/api/init.ts
import { cacheInvalidationService } from '@/lib/services/cache-invalidation.service';

let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    await cacheInvalidationService.start();
    initialized = true;
  }
  res.status(200).json({ initialized: true });
}
```

#### Option C: In Next.js Custom Server

```typescript
// server.ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { cacheInvalidationService } from './src/lib/services/cache-invalidation.service';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Start cache invalidation service
  cacheInvalidationService.start();

  createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});
```

### 4. Monitor Queue Status

```bash
# Check cache invalidation queue status
curl http://localhost:3000/api/cache-invalidation/status

# Response:
{
  "status": "ok",
  "service": "cache-invalidation",
  "stats": {
    "pending": 5,      // events waiting to be processed
    "processed": 1234, // events already processed
    "total": 1239
  },
  "timestamp": "2025-05-20T10:30:45.123Z"
}
```

## Example Usage

### Before (Manual Cache Invalidation)

```typescript
// ❌ Easy to forget, prone to bugs
async function updateUser(userId: number, data: any) {
  await db.users.update(userId, data);
  
  // Manual cache delete - must remember to do this!
  await cacheDelete(`user:${userId}`);
  await cacheDelete(`users:*`);
  // What if we forgot one of these? Stale data!
}
```

### After (Automatic Cache Invalidation)

```typescript
// ✅ No manual cache management needed
async function updateUser(userId: number, data: any) {
  await db.users.update(userId, data);
  
  // Triggers automatically handle cache invalidation!
  // The following cache keys are invalidated by the trigger:
  // - user:{userId}
  // - users:*
  // - user:email:{oldEmail}
  // - user:email:{newEmail}
}
```

## Cache Key Naming Convention

The triggers use these key patterns:

```
Single Records:
  user:{userId}
  student:{studentId}
  course:{courseId}
  enrollment:{enrollmentId}
  exam_result:{resultId}

By Reference:
  user:email:{email}
  course:code:{courseCode}
  student:enrollment:{enrollmentId}

Collections:
  users:*
  students:*
  courses:*
  enrollments:*
  exam_results:*

Related Data:
  department:{deptId}:students
  department:{deptId}:courses
  faculty:{facultyId}:courses
  student:{studentId}:enrollments
  course:{courseId}:enrollments
  enrollment:{enrollmentId}:results
  student:{studentId}:gpa
  analytics:student:{studentId}
```

## How to Add More Tables

To add cache invalidation for a new table:

1. Create trigger function for INSERT:
```sql
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_cache_mytable_insert
AFTER INSERT ON mytable FOR EACH ROW
BEGIN
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('mytable:', NEW.id), 'delete', 'mytable', NEW.id);
    
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('mytables:*'), 'invalidate', 'mytable', NEW.id);
END$$
DELIMITER ;
```

2. Create similar triggers for UPDATE and DELETE

3. No changes needed to Node.js code - it will automatically process new events!

## Monitoring & Cleanup

### View Pending Events

```sql
SELECT * FROM cache_invalidation_queue WHERE processed = FALSE;
```

### Clean Up Old Events

```typescript
// Remove events older than 7 days
await cacheInvalidationService.clearProcessedEvents(7);
```

### Database Query to Monitor

```sql
SELECT 
    table_name,
    COUNT(*) as event_count,
    COUNT(CASE WHEN processed = FALSE THEN 1 END) as pending_count,
    MAX(created_at) as latest_event
FROM cache_invalidation_queue
GROUP BY table_name
ORDER BY latest_event DESC;
```

## Performance Considerations

- **Poll Interval**: Currently 1 second (adjustable in `cache-invalidation.service.ts`)
- **Batch Size**: 100 events per poll (adjustable in `processInvalidationQueue()`)
- **Database Connection**: Uses connection pooling (5 connections max)
- **Redis Operations**: Non-blocking async operations

### Optimization Tips

1. **For High-Traffic Apps**: Increase batch size from 100 to 500-1000
2. **For Low-Traffic Apps**: Increase poll interval from 1s to 5-10s
3. **Monitor Queue Growth**: If pending events keep growing, increase batch size or reduce poll interval

## Troubleshooting

### Queue Not Processing

```bash
# Check if service is running
curl http://localhost:3000/api/cache-invalidation/status

# Check recent database errors
SELECT * FROM cache_invalidation_queue 
WHERE processed = FALSE 
AND created_at > NOW() - INTERVAL 1 HOUR;

# Verify triggers exist
SHOW TRIGGERS IN university_main;
```

### Too Many Pending Events

```sql
-- Check which tables are generating most events
SELECT table_name, COUNT(*) as count 
FROM cache_invalidation_queue 
WHERE processed = FALSE 
GROUP BY table_name;

-- If one table dominates, consider optimizing that trigger
```

### Cache Not Invalidating

1. Verify trigger SQL was executed successfully
2. Check database connection in `.env`
3. Verify Redis is running
4. Check service is started: `curl http://localhost:3000/api/cache-invalidation/status`

## Benefits Summary

✅ **Automatic**: No manual cache management  
✅ **Guaranteed Sync**: Database and cache always in sync  
✅ **Event-Driven**: Scales with your data changes  
✅ **Transparent**: Works behind the scenes  
✅ **Debuggable**: Queue is visible in database  
✅ **Tunable**: Batch size and poll interval adjustable  
