# MySQL Database Setup for StapuBox

## 1. Environment Configuration

Add these environment variables to your Replit project:

```bash
# Your MySQL Database Credentials
MYSQL_HOST=your.mysql.server.com
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=stapubox_db
MYSQL_SSL=false  # Set to 'true' if your server requires SSL
```

## 2. Database Access Steps

### A. Linux Terminal Connection

```bash
# Method 1: Using mysql client
mysql -h your.mysql.server.com -P 3306 -u your_username -p stapubox_db

# Method 2: Using mysql with full connection string
mysql "mysql://your_username:your_password@your.mysql.server.com:3306/stapubox_db"

# Method 3: Using mycli (enhanced mysql client)
mycli mysql://your_username:your_password@your.mysql.server.com:3306/stapubox_db
```

### B. Online Database Access

Most network MySQL databases provide web interfaces:
- **phpMyAdmin**: Usually available at `https://your.server.com/phpmyadmin`
- **MySQL Workbench**: Desktop application for database management
- **DBeaver**: Free universal database tool

## 3. StapuBox Database Tables

The application will automatically create these tables:

```sql
-- Users table
users (id, phone_number, name, user_type, date_of_birth, age, bio, profile_photo_url, city, society_area, workplace, email, location_coordinates, location_name, is_active, created_at, updated_at)

-- User activities
user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at)

-- Interest connections
interests (id, sender_id, receiver_id, status, sent_at, responded_at)

-- Career applications
career_applications (id, name, email, phone, contribution_area, resume_url, submitted_at)

-- Investor inquiries
investor_inquiries (id, name, phone, business_email, submitted_at)

-- Feed items (StapuBuzz news)
feed_items (id, title, content, excerpt, category, image_url, like_count, published_at)

-- Feed likes
feed_likes (id, user_id, feed_item_id, created_at)

-- Sessions (authentication)
sessions (id, phone_number, session_token, session_type, expires_at, user_id, created_at)

-- OTP verifications
otp_verifications (id, phone_number, otp, expires_at, verified, created_at)
```

## 4. Application Activity Monitoring

All user activities will be stored:
- User registrations and profile updates
- Interest sending/receiving 
- Feed interactions (likes, shares)
- Career and investor applications
- Authentication sessions
- Real-time app usage data

## 5. Query Examples

```sql
-- View all users
SELECT * FROM users ORDER BY created_at DESC;

-- Check app activity
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as active_sessions FROM sessions WHERE expires_at > NOW();
SELECT COUNT(*) as today_interests FROM interests WHERE DATE(sent_at) = CURDATE();

-- Monitor StapuBuzz engagement
SELECT category, COUNT(*) as posts, SUM(like_count) as total_likes 
FROM feed_items 
GROUP BY category;

-- User activity analysis
SELECT u.name, u.user_type, u.city, COUNT(i.id) as interests_sent
FROM users u 
LEFT JOIN interests i ON u.id = i.sender_id 
GROUP BY u.id
ORDER BY interests_sent DESC;
```

## 6. Backup and Maintenance

```sql
-- Create backup
mysqldump -h your.mysql.server.com -u your_username -p stapubox_db > backup.sql

-- Restore backup
mysql -h your.mysql.server.com -u your_username -p stapubox_db < backup.sql
```