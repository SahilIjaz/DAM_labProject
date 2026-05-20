# Cache Invalidation via Triggers - Deep Dive Explanation

## What Problem Does This Solve?

### The Challenge with Caching

When you cache data in Redis, you have a copy of database information. But when that data changes, the cache becomes **stale** - it's outdated.

```
Time 0:
  Database: user.name = "Alice"
  Cache:    user.name = "Alice"  ✓ In sync

Time 1: Database is updated
  Database: user.name = "Bob"
  Cache:    user.name = "Alice"  ✗ OUT OF SYNC!

Time 2: Old data served from cache
  Client receives: user.name = "Alice"  
  But database says: user.name = "Bob"
  🐛 BUG! User sees wrong name!
```

### Traditional Solution (Manual)

```typescript
async function updateUserName(userId, newName) {
  // Step 1: Update database
  await db.query('UPDATE users SET name = ? WHERE id = ?', [newName, userId]);
  
  // Step 2: Manually delete cache
  await cacheDelete(`user:${userId}`);
  
  // ⚠️ Problems:
  // - Easy to forget step 2
  // - If app crashes between steps, cache is stale
  // - Repeated across entire codebase
}
```

### New Solution (Automatic with Triggers)

```
Database Change Happens
         ⬇
MySQL Trigger Fires (AUTOMATIC)
         ⬇
Insert event into cache_invalidation_queue
         ⬇
CacheInvalidationService polls queue
         ⬇
Deletes from Redis
         ⬇
Cache is now fresh ✅
```

---

## How It Actually Works (Step by Step)

### Step 1: Trigger Fires

When you run this code:

```typescript
await db.query(
  'UPDATE users SET first_name = ? WHERE user_id = ?',
  ['John', 123]
);
```

The MySQL engine executes the UPDATE, then **automatically fires triggers** we defined:

```sql
DELIMITER $$
CREATE TRIGGER trg_cache_users_update
AFTER UPDATE ON users FOR EACH ROW
BEGIN
    -- These happen AUTOMATICALLY, no app code needed
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('user:', NEW.user_id), 'delete', 'users', NEW.user_id);
    
    INSERT INTO cache_invalidation_queue (cache_key, event_type, table_name, record_id)
    VALUES (CONCAT('users:*'), 'invalidate', 'users', NEW.user_id);
END$$
DELIMITER ;
```

### Step 2: Queue Gets Events

The trigger inserted rows into `cache_invalidation_queue`:

```
┌──────────┬─────────────────────┬──────────────┬────────────┬──────────────────┐
│ queue_id │ cache_key           │ event_type   │ table_name │ record_id        │
├──────────┼─────────────────────┼──────────────┼────────────┼──────────────────┤
│ 1001     │ user:123            │ delete       │ users      │ 123              │
│ 1002     │ users:*             │ invalidate   │ users      │ 123              │
│ 1003     │ user:email:john@... │ delete       │ users      │ 123              │
└──────────┴─────────────────────┴──────────────┴────────────┴──────────────────┘
```

### Step 3: Service Polls Queue

The `CacheInvalidationService` runs in the background (every 1 second):

```typescript
setInterval(async () => {
  // Query: "Give me unprocessed events"
  const events = await db.query(
    'SELECT * FROM cache_invalidation_queue WHERE processed = FALSE LIMIT 100'
  );
  
  // For each event, delete from Redis
  for (const event of events) {
    if (event.event_type === 'delete') {
      await redis.del(event.cache_key);  // Direct delete
    } else {
      await redis.keys(event.cache_key); // Pattern delete
    }
  }
}, 1000); // Every 1 second
```

### Step 4: Redis Gets Invalidated

```javascript
// For cache_key = "user:123"
await redis.del("user:123");
// Redis removes that key and value

// For cache_key = "users:*" (pattern)
const keys = await redis.keys("users:*");
// Redis finds: ["users:1", "users:2", "users:3", ...]
await redis.del(keys);
// Redis deletes all of them
```

### Step 5: Cache Is Fresh Again

Next time the app tries to use the cache:

```typescript
let user = await cacheGet('user:123');
// Returns: null (was just deleted)

// App realizes cache is empty, fetches from DB
user = await db.query('SELECT * FROM users WHERE user_id = 123');
// Gets: { user_id: 123, first_name: 'John', ... } ✓ Fresh!

// App re-caches it
await cacheSet('user:123', JSON.stringify(user), 3600);
```

---

## Real-World Example: Student Enrollment

Let's trace through a complete example:

### Scenario: Student Enrolls in Course

**Code that runs:**

```typescript
async function enrollStudent(studentId: number, courseId: number) {
  const conn = await pool.getConnection();
  
  try {
    await conn.query(
      'INSERT INTO enrollments (student_id, course_id, semester, status) VALUES (?, ?, ?, ?)',
      [studentId, courseId, 1, 'enrolled']
    );
  } finally {
    conn.release();
  }
  // ✅ No manual cache deletion needed!
}
```

**Automatic Chain Reaction:**

```
INSERT executed
         ⬇
MySQL Trigger trg_cache_enrollments_insert fires
         ⬇
Inserts 3 events into cache_invalidation_queue:
  ├─ cache_key: "enrollment:456" (the new enrollment ID)
  ├─ cache_key: "student:123:enrollments" (student's enrollment list)
  └─ cache_key: "course:789:enrollments" (course's enrollment list)
         ⬇
Service polls after 1 second
         ⬇
Deletes all 3 keys from Redis
         ⬇
Next request checks cache for student enrollments
  "Does cache have student:123:enrollments?"
  "No, it was just deleted"
  "Fetch from database and re-cache"
         ⬇
User sees updated enrollment list ✅
```

---

## Key Concepts Explained

### 1. Event Type: "delete" vs "invalidate"

**delete**: Remove specific key
```javascript
redis.del("user:123")  // Deletes just this one user's cache
```

**invalidate**: Pattern-based deletion
```javascript
redis.keys("users:*")  // Finds all keys like users:1, users:2, users:3, etc.
redis.del([...])       // Deletes all of them
```

### 2. Why Triggers?

Triggers guarantee execution at the database level:
- ✅ Can't be bypassed
- ✅ Works even if app crashes
- ✅ No code changes needed in app
- ✅ Scales automatically with data changes

```
Without Triggers:
  if (name_changed) {
    DELETE from cache;  // Developer must remember!
  }

With Triggers:
  // Database FORCES this to happen
  // No way to forget
```

### 3. Queue Pattern

Why use a queue instead of direct Redis calls from triggers?

```
❌ Direct approach (slow):
  Database Trigger → Redis.del() → Wait for response

✅ Queue approach (fast):
  Database Trigger → Insert to queue (instantly done)
  Later → Service → Redis.del() (in background)
```

Benefits:
- Doesn't block database operations
- Batches operations (process 100 at once)
- Can survive Redis outages temporarily
- Easy to monitor and debug

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Next.js App                          │
│                                                              │
│  const user = await cacheGet('user:123')                   │
│  user = user || await db.query(...)                        │
│  await cacheSet('user:123', user, 3600)                    │
└────────────┬────────────────────────┬──────────────────────┘
             │                        │
      Write-Through               Read-Through
             │                        │
             ▼                        ▼
    ┌─────────────────┐    ┌──────────────────┐
    │ MySQL Database  │    │  Redis Cache     │
    │                 │    │                  │
    │ users           │    │ user:123         │
    │ students        │    │ users:*          │
    │ courses         │    │ course:456       │
    │ enrollments     │    │ student:789      │
    │ exam_results    │    └────────┬─────────┘
    │                 │             │
    │ [TRIGGERS]  ◄──┘             │
    │  - Insert                    │
    │  - Update                    │
    │  - Delete                    │
    └────────────┬────────────────┘
                 │ INSERT into
                 │ cache_invalidation_queue
                 ▼
    ┌─────────────────────────────┐
    │ cache_invalidation_queue    │
    │ (MySQL Table)               │
    │                             │
    │ ┌─────────────────────────┐ │
    │ │ cache_key: "user:123"   │ │
    │ │ event_type: "delete"    │ │
    │ │ processed: false         │ │
    │ └─────────────────────────┘ │
    └────────────┬────────────────┘
                 │ Poll every 1 second
                 ▼
    ┌──────────────────────────────────┐
    │ CacheInvalidationService         │
    │ (Node.js Background Service)     │
    │                                  │
    │ while (running) {                │
    │   events = query_unprocessed()   │
    │   for event in events:           │
    │     redis.del(event.cache_key)   │
    │     mark_as_processed(event)     │
    │   sleep(1 second)                │
    │ }                                │
    └──────────────────────────────────┘
```

---

## Comparison: Before vs After

### Before (Manual Cache Deletion)

```typescript
// Scattered throughout codebase
if (updating_user) {
  await cacheDelete(`user:${id}`);
  await cacheDelete(`users:*`);
}

if (updating_student) {
  await cacheDelete(`student:${id}`);
  await cacheDelete(`students:*`);
  await cacheDelete(`department:${dept_id}:students`);
  // What if we missed one?
}

if (updating_enrollment) {
  await cacheDelete(`enrollment:${id}`);
  await cacheDelete(`student:${sid}:enrollments`);
  await cacheDelete(`course:${cid}:enrollments`);
  // Easy to miss related caches
}
```

**Problems:**
- 🐛 Easy to forget cache deletions
- 🐛 Inconsistent patterns
- 🐛 Repeated code
- 🐛 Hard to maintain
- 🐛 Can have stale data bugs

### After (Trigger-Based)

```typescript
// Application code is CLEAN
async function updateUser(id, data) {
  await db.query('UPDATE users SET ... WHERE user_id = ?', [id, ...]);
  // That's it! Triggers handle cache invalidation automatically
}

async function createStudent(data) {
  await db.query('INSERT INTO students ...', [...]);
  // Automatic! No manual cache work needed
}
```

**Benefits:**
- ✅ Automatic and guaranteed
- ✅ Consistent across all tables
- ✅ No repeated code
- ✅ Easy to maintain
- ✅ Zero stale data bugs
- ✅ Developer can't forget

---

## When Cache is Invalidated

```
User Updates Name
        ⬇
Database triggers run
        ⬇
Events queued:
  - user:{id}
  - users:*
  - user:email:{old}
  - user:email:{new}
        ⬇
Service processes (within 1 second)
        ⬇
Cache keys deleted from Redis
        ⬇
Next request:
  - Cache miss (empty)
  - Fetch from DB (fresh data)
  - Store in cache
  - Show to user ✅
```

**Total latency: ~1 second from database change to cache refresh**

This is acceptable because:
- Background operation
- Doesn't block the update
- Service can batch multiple changes

---

## Performance Impact

### On Database
- ✅ Minimal: Simple INSERT statements to queue table
- ✅ Trigger execution: < 1ms per operation
- ✅ Queue grows: ~1-2 MB per 100k operations

### On Redis
- ✅ Minimal: Standard delete operations
- ✅ Pattern deletes: Efficient with proper key naming
- ✅ Can process thousands per second

### On Application
- ✅ No impact: Happens in background
- ✅ No waiting: Fire-and-forget from app's perspective
- ✅ Improved: Less cache management code

---

## Summary

```
BEFORE: Manual cache deletion
  ❌ Scattered code
  ❌ Easy to forget
  ❌ Stale data bugs

AFTER: Trigger-based invalidation
  ✅ Automatic
  ✅ Guaranteed
  ✅ No stale data
  ✅ Clean code
```

The database ensures cache stays in sync with actual data!
