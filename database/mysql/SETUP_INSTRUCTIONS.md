# Database Setup Instructions

## Step 1: Open MySQL and Drop Old Database
```bash
mysql -u root -p
# Enter your MySQL password when prompted
```

Then in the MySQL prompt, run:
```sql
DROP DATABASE IF EXISTS university_main;
EXIT;
```

## Step 2: Import New Schema with Fixed Collation
```bash
mysql -u root -p < database/mysql/schema.sql
mysql -u root -p < database/mysql/stored-procedures.sql
```

Enter your MySQL password when prompted.

## Step 3: Verify the Database
```bash
mysql -u root -p -e "USE university_main; SHOW TABLES; SHOW CREATE TABLE users \G"
```

You should see all tables listed with `utf8mb4_general_ci` collation.

## Done!
Your database is now set up with correct collation. Try logging in again.
