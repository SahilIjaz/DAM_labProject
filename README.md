# Distributed University Management System

A comprehensive, distributed university management system built with Next.js, Node.js, MySQL, PostgreSQL, and Redis. The system manages students, faculty, courses, enrollments, exams, and analytics across multiple campuses with automated replication and disaster recovery.

## Features

### Core Functionality
- **Student Management**: Registration, enrollment tracking, GPA calculation, and academic records
- **Faculty Management**: Faculty profiles, course assignments, and performance analytics
- **Course Management**: Course creation, enrollment management, capacity tracking
- **Exam Management**: Exam scheduling, result recording, and grade analytics
- **Department Management**: Multi-department support across multiple campuses
- **User Roles & Permissions**: 10 role-based access control system

### Technical Architecture
- **Distributed Database**: MySQL master-slave replication across 3 campuses
- **Analytics Database**: PostgreSQL for advanced analytics and reporting
- **Caching Layer**: Redis for performance optimization
- **API Layer**: RESTful API with JWT authentication
- **Frontend**: Next.js 14+ with React and TypeScript
- **Type Safety**: Full TypeScript implementation across the stack

### Advanced Features
- Audit logging and compliance tracking
- Database transaction support (ACID compliance)
- Stored procedures for complex business logic
- Triggers for automated data validation
- Advanced analytics functions
- Replication monitoring and failover
- Backup and disaster recovery

## Project Structure

```
DAM-lab_project/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Dashboard page
│   │   ├── students/         # Student management pages
│   │   ├── courses/          # Course management pages
│   │   ├── faculty/          # Faculty pages
│   │   ├── login/            # Authentication
│   │   ├── register/         # User registration
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/
│   │   ├── auth/             # Login/Register forms
│   │   ├── common/           # Navbar, layout components
│   │   ├── students/         # Student components
│   │   └── courses/          # Course components
│   ├── context/              # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/
│   │   ├── api/              # API service layer
│   │   ├── db/               # Database connections
│   │   ├── middleware/       # Authentication middleware
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Utility functions
│   └── styles/               # CSS modules
├── database/
│   ├── mysql/
│   │   ├── schema.sql        # MySQL schema
│   │   ├── stored-procedures.sql
│   │   └── triggers.sql
│   ├── postgresql/
│   │   ├── schema.sql        # PostgreSQL schema
│   │   └── functions.sql
│   ├── setup.sql             # Database initialization
│   ├── backup.sh             # Backup script
│   └── replication-config.sh # Replication setup
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.local                # Environment variables
└── README.md
```

## Prerequisites

- Node.js 18+
- npm or yarn
- MySQL 8.0+
- PostgreSQL 14+
- Redis 6.0+

## Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd DAM-lab_project
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file with the required configuration:
```env
# MySQL Primary
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=university_management_system

# MySQL Replicas
MYSQL_REPLICA_1_HOST=replica1.example.com
MYSQL_REPLICA_2_HOST=replica2.example.com

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=password
PG_DATABASE=university_analytics

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=86400

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=University Management System
```

### 4. Initialize databases
```bash
# MySQL
mysql -u root -p < database/mysql/schema.sql
mysql -u root -p < database/mysql/stored-procedures.sql
mysql -u root -p < database/mysql/triggers.sql

# PostgreSQL
psql -U postgres < database/postgresql/schema.sql
psql -U postgres < database/postgresql/functions.sql
```

### 5. Set up replication (optional)
```bash
chmod +x database/replication-config.sh
./database/replication-config.sh
```

### 6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### MySQL Tables
- **users**: User accounts with roles
- **roles**: 10 predefined roles (Super Admin, Faculty, Student, etc.)
- **students**: Student records linked to users
- **faculty**: Faculty records linked to users
- **courses**: Course information
- **enrollments**: Student course enrollments
- **exam_results**: Exam scores and grades
- **departments**: Academic departments
- **campuses**: University campuses
- **audit_logs_temp**: Temporary audit log table

### PostgreSQL Tables
- **audit_logs**: Persistent audit trail
- **system_logs**: System event logging
- **api_request_logs**: API request tracking
- **db_performance_metrics**: Database performance monitoring
- **backup_logs**: Backup operation tracking
- **user_activity_analytics**: User activity analysis
- **replication_status**: Replication health monitoring
- **student_performance_analytics**: Student performance metrics
- **course_performance_analytics**: Course performance metrics
- **faculty_performance_analytics**: Faculty performance metrics

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Students
- `GET /api/students` - List students
- `GET /api/students?search=term` - Search students
- `POST /api/students/create` - Create student

### Courses
- `GET /api/courses` - List courses
- `GET /api/courses?departmentId=1` - Filter by department
- `GET /api/courses?availableOnly=true` - List available courses

### Faculty
- `GET /api/faculty` - List faculty
- `GET /api/faculty?departmentId=1` - Faculty by department

### Enrollments
- `POST /api/enrollments` - Enroll student in course
- `GET /api/enrollments?studentId=1` - Student enrollments

### Exams
- `POST /api/exams` - Create exam result
- `GET /api/exams?studentId=1` - Student exam results

### Admin
- `GET /api/admin/statistics` - System statistics

## Key Features

### User Roles (10 levels)
1. **Super Admin** - Full system access
2. **DBA** - Database administration
3. **System Admin** - System administration
4. **Faculty** - Faculty member
5. **Department Head** - Department management
6. **Instructor** - Course teaching
7. **Student** - Course enrollment
8. **Support Staff** - Administrative support
9. **Data Entry** - Data entry operations
10. **Guest** - Limited guest access

### Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcryptjs
- SQL injection prevention via parameterized queries
- Audit logging of all operations
- Environment variable configuration

### Performance Features
- Redis caching layer
- Database connection pooling
- Query optimization with indexes
- Pagination support
- Lazy loading of components

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm run start
```

### Database Backup
```bash
chmod +x database/backup.sh
./database/backup.sh
```

## Stored Procedures

The system includes 8 stored procedures for complex operations:
1. `sp_create_user` - Create user with validation
2. `sp_enroll_student` - Enroll student in course
3. `sp_validate_credentials` - Validate login credentials
4. `sp_update_exam_result` - Update exam results and GPA
5. `sp_delete_student` - Delete student with cascade
6. `sp_generate_enrollment_id` - Generate enrollment IDs
7. `sp_bulk_update_grades` - Batch grade updates
8. `sp_transfer_student` - Transfer student between departments

## Triggers

Automated data validation and audit logging:
- Student insertion logging
- Exam result update tracking
- Course deletion audit
- Enrollment completion handling
- Over-enrollment prevention
- Automatic timestamp updates

## Analytics & Reporting

PostgreSQL functions for advanced analytics:
- `fn_calculate_student_score` - Performance scoring
- `fn_detect_anomalies` - Data quality checks
- `fn_generate_performance_report` - Student reports
- `fn_monitor_replication_lag` - Replication health
- `fn_calculate_data_quality_score` - Data quality metrics
- `fn_get_api_performance_metrics` - API analytics
- `fn_system_health_check` - System monitoring

## Disaster Recovery

The system includes:
- Automated daily backups
- Master-slave replication
- Replication lag monitoring
- Backup verification
- 30-day backup retention
- Emergency failover procedures

## Contributing

Guidelines for contributing to the project:
1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Ensure all tests pass

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Email: support@university.edu
- Documentation: [Wiki](https://github.com/university/dums/wiki)
- Issues: [GitHub Issues](https://github.com/university/dums/issues)

## Changelog

### v1.0.0 (2024)
- Initial release
- Complete database schema
- API implementation
- Frontend components
- Authentication system
- Analytics engine
- Replication setup

## Roadmap

- [ ] Mobile application
- [ ] Advanced reporting dashboard
- [ ] Email notifications
- [ ] SMS integration
- [ ] Video conferencing
- [ ] Document management
- [ ] Payment gateway
- [ ] Mobile app
