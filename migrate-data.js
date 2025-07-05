import fs from 'fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Load existing data
const dataFile = './storage-data.json';
let existingData = { users: [], userActivities: [], interests: [] };

if (fs.existsSync(dataFile)) {
  try {
    const fileContent = fs.readFileSync(dataFile, 'utf8');
    existingData = JSON.parse(fileContent);
    console.log('✅ Loaded existing data from storage-data.json');
  } catch (error) {
    console.log('⚠️ Could not load existing data:', error.message);
  }
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateData() {
  try {
    console.log('🔄 Starting data migration to PostgreSQL...');
    
    // Migrate users
    if (existingData.users && existingData.users.length > 0) {
      console.log(`📋 Migrating ${existingData.users.length} users...`);
      
      for (const [id, user] of existingData.users) {
        try {
          const result = await pool.query(`
            INSERT INTO users (
              phone_number, name, email, user_type, date_of_birth, age, 
              workplace, bio, profile_photo_url, location_coordinates, 
              location_name, city, society_area, profile_visibility, 
              is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (phone_number) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              updated_at = EXCLUDED.updated_at
            RETURNING id;
          `, [
            user.phoneNumber, user.name, user.email, user.userType, 
            user.dateOfBirth, user.age, user.workplace, user.bio, 
            user.profilePhotoUrl, user.locationCoordinates, user.locationName, 
            user.city, user.societyArea, user.profileVisibility, 
            user.isActive, user.createdAt, user.updatedAt
          ]);
          
          console.log(`  ✅ Migrated user: ${user.name} (ID: ${result.rows[0].id})`);
        } catch (error) {
          console.log(`  ❌ Failed to migrate user ${user.name}:`, error.message);
        }
      }
    }
    
    // Migrate user activities
    if (existingData.userActivities && existingData.userActivities.length > 0) {
      console.log(`🏃 Migrating ${existingData.userActivities.length} user activities...`);
      
      for (const [id, activity] of existingData.userActivities) {
        try {
          await pool.query(`
            INSERT INTO user_activities (
              user_id, activity_name, skill_level, is_primary, 
              coaching_experience_years, certifications
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT DO NOTHING;
          `, [
            activity.userId, activity.activityName, activity.skillLevel, 
            activity.isPrimary, activity.coachingExperienceYears, activity.certifications
          ]);
          
          console.log(`  ✅ Migrated activity: ${activity.activityName} for user ${activity.userId}`);
        } catch (error) {
          console.log(`  ❌ Failed to migrate activity:`, error.message);
        }
      }
    }
    
    // Migrate interests
    if (existingData.interests && existingData.interests.length > 0) {
      console.log(`💝 Migrating ${existingData.interests.length} interests...`);
      
      for (const [id, interest] of existingData.interests) {
        try {
          await pool.query(`
            INSERT INTO interests (
              sender_id, receiver_id, status, sent_at, responded_at
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (sender_id, receiver_id) DO UPDATE SET
              status = EXCLUDED.status,
              responded_at = EXCLUDED.responded_at;
          `, [
            interest.senderId, interest.receiverId, interest.status, 
            interest.createdAt || new Date().toISOString(), interest.updatedAt
          ]);
          
          console.log(`  ✅ Migrated interest: ${interest.senderId} → ${interest.receiverId} (${interest.status})`);
        } catch (error) {
          console.log(`  ❌ Failed to migrate interest:`, error.message);
        }
      }
    }
    
    console.log('🎉 Data migration completed successfully!');
    
    // Show summary
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const activityCount = await pool.query('SELECT COUNT(*) FROM user_activities');
    const interestCount = await pool.query('SELECT COUNT(*) FROM interests');
    
    console.log('\n📊 Database Summary:');
    console.log(`  Users: ${userCount.rows[0].count}`);
    console.log(`  Activities: ${activityCount.rows[0].count}`);
    console.log(`  Interests: ${interestCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateData();