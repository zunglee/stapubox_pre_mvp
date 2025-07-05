# PostgreSQL Database Guide for StapuBox

## Database Connection
```
Host: ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech
Database: neondb
User: neondb_owner
Password: [Available in DATABASE_URL environment variable]
Connection URL: DATABASE_URL=postgresql://neondb_owner:npg_dwAQM3ULCKs5@ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Current Database Schema

### 1. Users Table
```sql
-- View all users
SELECT * FROM users ORDER BY id;

-- Get user count
SELECT COUNT(*) FROM users;

-- Find specific user
SELECT * FROM users WHERE phone_number = '9643673900';

-- Update user data
UPDATE users SET name = 'New Name' WHERE id = 1;
```

### 2. User Activities Table
```sql
-- View all activities
SELECT ua.*, u.name as user_name 
FROM user_activities ua 
JOIN users u ON ua.user_id = u.id 
ORDER BY ua.user_id;

-- Get activities for specific user
SELECT * FROM user_activities WHERE user_id = 1;

-- Add new activity
INSERT INTO user_activities (user_id, activity_name, skill_level, is_primary) 
VALUES (1, 'Swimming', 'intermediate', false);
```

### 3. Interests Table
```sql
-- View all interests with user names
SELECT i.*, 
       sender.name as sender_name, 
       receiver.name as receiver_name
FROM interests i
JOIN users sender ON i.sender_id = sender.id
JOIN users receiver ON i.receiver_id = receiver.id
ORDER BY i.sent_at DESC;

-- Get pending interests
SELECT * FROM interests WHERE status = 'pending';

-- Update interest status
UPDATE interests SET status = 'accepted', responded_at = NOW() 
WHERE id = 1;
```

### 4. Sessions Table
```sql
-- View active sessions
SELECT * FROM sessions WHERE expires_at > NOW();

-- Clean expired sessions
DELETE FROM sessions WHERE expires_at < NOW();
```

### 5. OTP Verifications Table
```sql
-- View recent OTP attempts
SELECT * FROM otp_verifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Clean old OTP records
DELETE FROM otp_verifications WHERE created_at < NOW() - INTERVAL '1 hour';
```

### 6. StapuBuzz Interactions Table
```sql
-- View all interactions
SELECT * FROM stapubuzz_interactions ORDER BY created_at DESC;

-- Get like count for specific buzz
SELECT COUNT(*) FROM stapubuzz_interactions 
WHERE buzz_id = 1 AND action = 'like' AND value = true;

-- Get user's liked articles
SELECT DISTINCT buzz_id FROM stapubuzz_interactions 
WHERE user_id = '1' AND action = 'like' AND value = true;
```

### 7. Career Applications Table
```sql
-- View all applications
SELECT * FROM career_applications ORDER BY submitted_at DESC;

-- Export applications to CSV (run in admin dashboard)
SELECT name, email, phone, contribution_area, resume_url 
FROM career_applications;
```

### 8. Investor Inquiries Table
```sql
-- View all inquiries
SELECT * FROM investor_inquiries ORDER BY submitted_at DESC;

-- Get recent inquiries
SELECT * FROM investor_inquiries 
WHERE submitted_at > NOW() - INTERVAL '7 days';
```

## Common Maintenance Tasks

### 1. Data Backup
```sql
-- Export users data
COPY users TO '/tmp/users_backup.csv' WITH CSV HEADER;

-- Export interests data
COPY interests TO '/tmp/interests_backup.csv' WITH CSV HEADER;
```

### 2. Performance Monitoring
```sql
-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public';

-- View active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

### 3. Data Cleanup
```sql
-- Remove expired OTP records
DELETE FROM otp_verifications WHERE created_at < NOW() - INTERVAL '24 hours';

-- Remove old sessions
DELETE FROM sessions WHERE expires_at < NOW();

-- Remove test data (if needed)
DELETE FROM users WHERE phone_number LIKE 'test%';
```

## Migration History

### From MySQL to PostgreSQL (July 1, 2025)
- **Reason**: MySQL had IP-based access restrictions preventing Node.js connections
- **Process**: Used Drizzle migrations to create PostgreSQL schema
- **Data Transfer**: Migrated 3 users, 5 activities, 1 interest with proper ID mapping
- **Result**: Full functionality preserved with better connection reliability

### Key Schema Changes
1. **ID Fields**: Changed from `int AUTO_INCREMENT` to `serial PRIMARY KEY`
2. **Timestamps**: Standardized to `timestamp DEFAULT NOW()`
3. **JSON Fields**: Updated session storage format for PostgreSQL compatibility
4. **Constraints**: Added proper foreign key relationships

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql "postgresql://neondb_owner:npg_dwAQM3ULCKs5@ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Check if database is accessible
nc -zv ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech 5432
```

### Performance Issues
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE city = 'Mumbai';

-- Check index usage
SELECT * FROM pg_stat_user_indexes;

-- Create missing indexes
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_interests_status ON interests(status);
```

### Data Integrity Checks
```sql
-- Verify foreign key relationships
SELECT COUNT(*) FROM user_activities ua 
LEFT JOIN users u ON ua.user_id = u.id 
WHERE u.id IS NULL;

-- Check for orphaned interests
SELECT COUNT(*) FROM interests i
LEFT JOIN users sender ON i.sender_id = sender.id
LEFT JOIN users receiver ON i.receiver_id = receiver.id
WHERE sender.id IS NULL OR receiver.id IS NULL;
```

## Admin Dashboard Access

### Authorized Users
- nakumar987@gmail.com
- ankiteshiiita@gmail.com  
- shubhamraj01@gmail.com

### Available Operations
- View all database tables
- Download data as CSV
- Real-time data visualization
- Edit/delete records
- Monitor system health

## Environment Variables
```
DATABASE_URL=postgresql://neondb_owner:npg_dwAQM3ULCKs5@ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
PGHOST=ep-winter-morning-adu09smu.c-2.us-east-1.aws.neon.tech
PGDATABASE=neondb
PGUSER=neondb_owner
PGPASSWORD=[Auto-configured from DATABASE_URL]
PGPORT=5432
```