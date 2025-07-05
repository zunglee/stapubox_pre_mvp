# PostgreSQL Database Commands Guide

## Database Connection Info
- **Database URL**: `postgresql://neondb_owner:npg_dwAQM3ULCKs5@ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
- **Host**: `ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech`
- **Database**: `neondb`
- **User**: `neondb_owner`

## Connection Commands

### Using psql (command line)
```bash
psql postgresql://neondb_owner:npg_dwAQM3ULCKs5@ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Using environment variable
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_dwAQM3ULCKs5@ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
psql $DATABASE_URL
```

## Table Structure and CRUD Commands

### 1. Users Table
```sql
-- View all users
SELECT * FROM users;

-- Count users
SELECT COUNT(*) FROM users;

-- View user details with activities
SELECT u.*, array_agg(ua.activity_name) as activities
FROM users u
LEFT JOIN user_activities ua ON u.id = ua.user_id
GROUP BY u.id;

-- Insert new user
INSERT INTO users (phone_number, name, email, user_type, date_of_birth, age, workplace, city)
VALUES ('1234567890', 'Test User', 'test@example.com', 'player', '1990-01-01', 34, 'Test Company', 'Test City');

-- Update user
UPDATE users SET name = 'Updated Name' WHERE id = 1;

-- Delete user (cascades to activities and interests)
DELETE FROM users WHERE id = 1;
```

### 2. User Activities Table
```sql
-- View all activities
SELECT * FROM user_activities;

-- View activities with user info
SELECT ua.*, u.name as user_name
FROM user_activities ua
JOIN users u ON ua.user_id = u.id;

-- Insert activity
INSERT INTO user_activities (user_id, activity_name, skill_level, is_primary)
VALUES (1, 'Tennis', 'intermediate', true);

-- Update activity
UPDATE user_activities SET skill_level = 'advanced' WHERE id = 1;

-- Delete activity
DELETE FROM user_activities WHERE id = 1;
```

### 3. Interests Table
```sql
-- View all interests
SELECT * FROM interests;

-- View interests with user names
SELECT i.*, 
       u1.name as sender_name, 
       u2.name as receiver_name
FROM interests i
JOIN users u1 ON i.sender_id = u1.id
JOIN users u2 ON i.receiver_id = u2.id;

-- Insert interest
INSERT INTO interests (sender_id, receiver_id, status, sent_at)
VALUES (1, 2, 'pending', NOW());

-- Update interest status
UPDATE interests SET status = 'accepted', responded_at = NOW() WHERE id = 1;

-- Delete interest
DELETE FROM interests WHERE id = 1;
```

### 4. Sessions Table
```sql
-- View all sessions
SELECT * FROM sessions ORDER BY created_at DESC;

-- Clean expired sessions
DELETE FROM sessions WHERE expires_at < NOW();
```

### 5. Career Applications Table
```sql
-- View all applications
SELECT * FROM career_applications ORDER BY submitted_at DESC;

-- Insert application
INSERT INTO career_applications (name, email, phone, contribution_area)
VALUES ('John Doe', 'john@example.com', '9876543210', 'Engineering');
```

### 6. Feed Items and Likes Tables
```sql
-- View feed items with like counts
SELECT fi.*, COUNT(fl.id) as actual_likes
FROM feed_items fi
LEFT JOIN feed_likes fl ON fi.id = fl.feed_item_id
GROUP BY fi.id;
```

## Useful Queries

### Database Statistics
```sql
-- Table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public';

-- Row counts for all tables
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'user_activities', COUNT(*) FROM user_activities
UNION ALL
SELECT 'interests', COUNT(*) FROM interests
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'career_applications', COUNT(*) FROM career_applications
UNION ALL
SELECT 'feed_items', COUNT(*) FROM feed_items;
```

### Data Integrity Checks
```sql
-- Check for orphaned activities
SELECT * FROM user_activities ua
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ua.user_id);

-- Check for orphaned interests
SELECT * FROM interests i
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = i.sender_id)
   OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = i.receiver_id);
```

### Export Data (CSV)
```sql
-- Export users to CSV
COPY (SELECT * FROM users) TO '/tmp/users.csv' WITH CSV HEADER;

-- Export user activities to CSV
COPY (SELECT * FROM user_activities) TO '/tmp/activities.csv' WITH CSV HEADER;
```

## Admin Operations

### Backup Commands
```bash
# Full database backup
pg_dump $DATABASE_URL > stapubox_backup.sql

# Restore from backup
psql $DATABASE_URL < stapubox_backup.sql
```

### Schema Management
```sql
-- View table structure
\d users
\d user_activities
\d interests

-- View all tables
\dt

-- View indexes
\di
```