# Distributed Architecture Setup Guide

This document guides you through setting up the 8-microservice architecture for the DAM Lab University Management System.

## Architecture Overview

```
Next.js Frontend (port 3000)
  ↓
API Gateway (/api/gateway/*)
  ↓
┌──────────────────────────────────────────┐
│ Auth (3001) | Students (3002) | Courses (3003) │
│ Faculty (3004) | Enrollments (3005) | Exams (3006) │
│ Admin (3007) | Analytics (3008) │
└──────────────────────────────────────────┘
  ↓
MySQL + PostgreSQL + Redis
```

## Current Status

✅ **Phase 1 Complete:**
- Created `services/shared/` with shared types and auth utilities
- Created `services/auth-service/` - Auth microservice on port 3001

**Next Steps:**
Build the remaining 7 services and the API Gateway following the same pattern.

## Service Template Structure

Each service follows this pattern:

```
services/<service-name>/
  src/
    index.ts        ← Express server entry point
    routes.ts       ← Route definitions
    db.ts           ← Database connection (MySQL or PostgreSQL)
    cache.ts        ← Optional Redis caching utilities
  package.json      ← Service-specific dependencies
  tsconfig.json     ← TypeScript config
  .env.example      ← Environment variables template
```

## How to Build Each Service

### 1. **Student Service (port 3002)**

Copy the auth-service structure but replace routes with:
- `GET /students` — list all students (with caching)
- `GET /students/:id` — get student by ID
- `GET /students/:id/enrollments` — get student's enrollments

Move these functions from `src/lib/api/students.ts`:
- getStudents, getStudentById, getStudentByUserId, getStudentEnrollments, getStudentGPA, etc.

### 2. **Course Service (port 3003)**

Endpoints:
- `GET /courses` — list courses (cached, TTL 600s)
- `GET /courses/:id` — get course details
- `POST /courses` — create course (faculty/admin only)
- `PUT /courses/:id` — update course
- `DELETE /courses/:id` — delete course

Move from: `src/lib/api/courses.ts`

### 3. **Faculty Service (port 3004)**

Endpoints:
- `GET /faculty` — list faculty
- `GET /faculty/:id` — faculty details
- `GET /faculty/dashboard` — faculty dashboard (calls course-service + student-service internally)

Move from: `src/lib/api/faculty.ts`

**Note:** Faculty dashboard will need to make HTTP calls to:
- `http://localhost:3003/courses?departmentId=X` (course-service)
- `http://localhost:3002/students?departmentId=X` (student-service)

### 4. **Enrollment Service (port 3005)**

Endpoints:
- `POST /enrollments` — enroll in course
- `GET /enrollments/check?courseId=X&studentId=Y` — check enrollment status
- `DELETE /enrollments/:id` — drop course

Move from: `src/lib/api/enrollments.ts`

**Auth:** Call auth-service `GET /auth/verify` to validate tokens

### 5. **Exam Service (port 3006)**

Endpoints:
- `GET /exams` — list exams
- `POST /exams` — create exam
- `GET /exams/:id/results` — exam results
- `POST /exams/:id/results` — record result
- `GET /grades` — student grades
- `PUT /grades/:id` — update grade

Move from: `src/lib/api/exams.ts` and `src/lib/api/grades.ts`

### 6. **Admin Service (port 3007)**

Endpoints:
- `GET /admin/statistics` — system stats
- `GET /users` — all users
- `POST /users` — create user
- `GET /departments` — departments
- `GET /reports/*` — various reports
- `GET /users/profile` — current user profile

Move from: `src/lib/api/admin.ts`, `src/lib/api/departments.ts`, etc.

### 7. **Analytics Service (port 3008)**

**Database:** PostgreSQL only (not MySQL)

Endpoints:
- `GET /analytics/students/performance` — student analytics
- `GET /analytics/courses/performance` — course performance
- `GET /analytics/api-metrics` — API metrics
- `GET /analytics/system-health` — system health

Move from: `src/lib/api/analytics.ts`

## API Gateway

Replace all `src/app/api/*` routes with a single gateway that proxies requests:

**File:** `src/app/api/gateway/[...path]/route.ts`

```typescript
// Example routing logic
GET  /api/auth/login     → POST   http://localhost:3001/auth/login
GET  /api/auth/register  → POST   http://localhost:3001/auth/register
GET  /api/auth/verify    → GET    http://localhost:3001/auth/verify
GET  /api/students       → GET    http://localhost:3002/students
GET  /api/courses        → GET    http://localhost:3003/courses
GET  /api/faculty        → GET    http://localhost:3004/faculty
POST /api/enrollments    → POST   http://localhost:3005/enrollments
GET  /api/exams          → GET    http://localhost:3006/exams
GET  /api/admin/*        → GET    http://localhost:3007/admin/*
GET  /api/analytics/*    → GET    http://localhost:3008/analytics/*
```

The gateway forwards all headers (including `Authorization: Bearer <token>`).

## Orchestration Scripts

### Install all services:
```bash
#!/bin/bash
# services/install-all.sh
for dir in auth-service student-service course-service faculty-service enrollment-service exam-service admin-service analytics-service; do
  cd services/$dir && npm install && cd ../..
done
```

### Start all services:
```bash
#!/bin/bash
# services/start-all.sh
cd services/auth-service && npm run dev &
cd ../student-service && npm run dev &
cd ../course-service && npm run dev &
# ... repeat for all 8 services
```

Add to root `package.json`:
```json
{
  "scripts": {
    "services:install": "bash services/install-all.sh",
    "services:start": "bash services/start-all.sh",
    "dev": "next dev"  // Frontend still runs on 3000
  }
}
```

## Environment Variables

Each service needs a `.env` file based on its `.env.example`:

**Auth Service (.env):**
```
PORT=3001
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=university_main
JWT_SECRET=your-secret-key
```

**Student Service (.env):**
```
PORT=3002
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=university_main
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key  # Same as auth service!
```

**Analytics Service (.env):**
```
PORT=3008
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=password
PG_DATABASE=university_analytics
JWT_SECRET=your-secret-key  # Same JWT secret!
```

## Cross-Service Communication

When a service needs data from another service, make an HTTP call:

```typescript
// Example: Faculty Service calling Course Service
const getCoursesByDepartment = async (departmentId: number, token: string) => {
  const response = await fetch(`http://localhost:3003/courses?departmentId=${departmentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Authentication Flow

1. **Login** → Auth Service validates → Returns JWT token
2. **Other requests** → Include `Authorization: Bearer <token>` header
3. **Each service** → Calls `http://localhost:3001/auth/verify` to validate token
4. **Token valid** → Service processes request
5. **Token invalid** → Service returns 401 Unauthorized

## Testing the Setup

1. **Install:** `npm run services:install`
2. **Start:** `npm run services:start` (in one terminal) + `npm run dev` (in another for Next.js)
3. **Verify auth-service is running:**
   ```bash
   curl http://localhost:3001/auth/health
   # Response: {"status":"ok","service":"auth-service"}
   ```
4. **Test login:**
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password"}'
   ```
5. **Access frontend:** `http://localhost:3000`

## Key Differences from Monolithic

| Aspect | Monolithic | Distributed |
|--------|-----------|------------|
| API calls | Direct DB queries | HTTP calls to services |
| Database | Single MySQL | MySQL per service + PostgreSQL |
| Caching | Global Redis | Per-service Redis with namespaces |
| Auth | Inline middleware | Central auth-service |
| Scaling | Scale whole app | Scale individual services |
| Deployment | Single deploy | Deploy services independently |

## Notes

- Keep `JWT_SECRET` the same across all services
- Each service validates tokens by calling auth-service
- Use Redis namespaces (e.g., `student:list`, `course:123`) to avoid cache collisions
- Services can go down individually without affecting others
- Frontend `fetch()` URLs don't change — gateway handles routing

For detailed implementation of each service, refer to the phase numbers in the plan file.
