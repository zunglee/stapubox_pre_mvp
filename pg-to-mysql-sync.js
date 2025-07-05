import { Pool as PgPool } from '@neondatabase/serverless';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema.ts';
import ws from 'ws';

// Configure neon for serverless
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

class PostgreSQLToMySQLSync {
  constructor() {
    // PostgreSQL connection
    this.pgPool = new PgPool({ connectionString: process.env.DATABASE_URL });
    this.pgDb = drizzle({ client: this.pgPool, schema });
    
    // MySQL connection config
    this.mysqlConfig = {
      host: '147.93.107.184',
      port: 3306,
      user: 'replit-appv2',
      password: 'replit123',
      database: 'stapubox_db',
      connectTimeout: 15000
    };
  }

  async testConnections() {
    console.log('Testing database connections...');
    
    // Test PostgreSQL
    try {
      const pgResult = await this.pgDb.execute(sql`SELECT 1 as test`);
      console.log('✅ PostgreSQL connection successful');
    } catch (error) {
      console.log('❌ PostgreSQL connection failed:', error.message);
      return false;
    }

    // Test MySQL
    try {
      const mysqlConn = await mysql.createConnection(this.mysqlConfig);
      await mysqlConn.execute('SELECT 1 as test');
      await mysqlConn.end();
      console.log('✅ MySQL connection successful');
      return true;
    } catch (error) {
      console.log('❌ MySQL connection failed:', error.message);
      return false;
    }
  }

  async createMySQLTables() {
    console.log('Creating/updating MySQL table structures...');
    
    const connection = await mysql.createConnection(this.mysqlConfig);
    
    try {
      // Create users table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phoneNumber VARCHAR(15) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          userType ENUM('player', 'coach') NOT NULL,
          dateOfBirth DATE NOT NULL,
          age INT NOT NULL,
          workplace VARCHAR(255),
          bio TEXT,
          profilePhotoUrl VARCHAR(500),
          locationCoordinates VARCHAR(100) NOT NULL,
          locationName VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          societyArea VARCHAR(255),
          profileVisibility ENUM('public', 'interest_only') DEFAULT 'public',
          isActive BOOLEAN DEFAULT true,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_phone (phoneNumber),
          INDEX idx_city (city),
          INDEX idx_usertype (userType),
          INDEX idx_active (isActive)
        )
      `);

      // Create user_activities table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_activities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          activityName VARCHAR(100) NOT NULL,
          skillLevel ENUM('beginner', 'learner', 'intermediate', 'advanced', 'expert') NOT NULL,
          isPrimary BOOLEAN DEFAULT false,
          coachingExperienceYears INT,
          certifications TEXT,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user (userId),
          INDEX idx_activity (activityName),
          INDEX idx_skill (skillLevel),
          INDEX idx_primary (isPrimary)
        )
      `);

      // Create interests table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS interests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          senderId INT NOT NULL,
          receiverId INT NOT NULL,
          status ENUM('pending', 'accepted', 'declined', 'withdrawn') DEFAULT 'pending',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_interest (senderId, receiverId),
          INDEX idx_sender (senderId),
          INDEX idx_receiver (receiverId),
          INDEX idx_status (status)
        )
      `);

      // Create sessions table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phoneNumber VARCHAR(15) NOT NULL,
          userId INT,
          sessionToken VARCHAR(128) UNIQUE NOT NULL,
          sessionType ENUM('otp_verified', 'profile_complete') NOT NULL,
          expiresAt TIMESTAMP NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_token (sessionToken),
          INDEX idx_phone (phoneNumber),
          INDEX idx_expires (expiresAt)
        )
      `);

      // Create otp_verifications table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS otp_verifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phoneNumber VARCHAR(15) NOT NULL,
          otp VARCHAR(6) NOT NULL,
          isVerified BOOLEAN DEFAULT false,
          expiresAt TIMESTAMP NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_phone_otp (phoneNumber, otp),
          INDEX idx_expires (expiresAt)
        )
      `);

      console.log('✅ MySQL tables created/updated successfully');
      
    } finally {
      await connection.end();
    }
  }

  async syncUsers() {
    console.log('Syncing users...');
    
    // Get users from PostgreSQL
    const pgUsers = await this.pgDb.select().from(schema.users);
    console.log(`Found ${pgUsers.length} users in PostgreSQL`);

    if (pgUsers.length === 0) {
      console.log('No users to sync');
      return;
    }

    const connection = await mysql.createConnection(this.mysqlConfig);
    
    try {
      let syncedCount = 0;
      let updatedCount = 0;
      
      for (const user of pgUsers) {
        try {
          // Try to insert user
          await connection.execute(`
            INSERT INTO users (
              id, phoneNumber, name, email, userType, dateOfBirth, age, 
              workplace, bio, profilePhotoUrl, locationCoordinates, 
              locationName, city, societyArea, profileVisibility, 
              isActive, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              email = VALUES(email),
              userType = VALUES(userType),
              dateOfBirth = VALUES(dateOfBirth),
              age = VALUES(age),
              workplace = VALUES(workplace),
              bio = VALUES(bio),
              profilePhotoUrl = VALUES(profilePhotoUrl),
              locationCoordinates = VALUES(locationCoordinates),
              locationName = VALUES(locationName),
              city = VALUES(city),
              societyArea = VALUES(societyArea),
              profileVisibility = VALUES(profileVisibility),
              isActive = VALUES(isActive),
              updatedAt = VALUES(updatedAt)
          `, [
            user.id, user.phoneNumber, user.name, user.email, user.userType,
            user.dateOfBirth, user.age, user.workplace, user.bio, user.profilePhotoUrl,
            user.locationCoordinates, user.locationName, user.city, user.societyArea,
            user.profileVisibility, user.isActive, user.createdAt, user.updatedAt
          ]);
          
          syncedCount++;
          
        } catch (error) {
          console.log(`Failed to sync user ${user.id}:`, error.message);
        }
      }
      
      console.log(`✅ Synced ${syncedCount} users to MySQL`);
      
    } finally {
      await connection.end();
    }
  }

  async syncUserActivities() {
    console.log('Syncing user activities...');
    
    const pgActivities = await this.pgDb.select().from(schema.userActivities);
    console.log(`Found ${pgActivities.length} activities in PostgreSQL`);

    if (pgActivities.length === 0) {
      console.log('No activities to sync');
      return;
    }

    const connection = await mysql.createConnection(this.mysqlConfig);
    
    try {
      // Clear and re-insert activities for simplicity
      await connection.execute('DELETE FROM user_activities');
      
      let syncedCount = 0;
      
      for (const activity of pgActivities) {
        try {
          await connection.execute(`
            INSERT INTO user_activities (
              id, userId, activityName, skillLevel, isPrimary, 
              coachingExperienceYears, certifications
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            activity.id, activity.userId, activity.activityName, 
            activity.skillLevel, activity.isPrimary, 
            activity.coachingExperienceYears, activity.certifications
          ]);
          
          syncedCount++;
          
        } catch (error) {
          console.log(`Failed to sync activity ${activity.id}:`, error.message);
        }
      }
      
      console.log(`✅ Synced ${syncedCount} activities to MySQL`);
      
    } finally {
      await connection.end();
    }
  }

  async syncInterests() {
    console.log('Syncing interests...');
    
    const pgInterests = await this.pgDb.select().from(schema.interests);
    console.log(`Found ${pgInterests.length} interests in PostgreSQL`);

    if (pgInterests.length === 0) {
      console.log('No interests to sync');
      return;
    }

    const connection = await mysql.createConnection(this.mysqlConfig);
    
    try {
      // Clear and re-insert interests
      await connection.execute('DELETE FROM interests');
      
      let syncedCount = 0;
      
      for (const interest of pgInterests) {
        try {
          await connection.execute(`
            INSERT INTO interests (
              id, senderId, receiverId, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            interest.id, interest.senderId, interest.receiverId, 
            interest.status, interest.createdAt, interest.updatedAt
          ]);
          
          syncedCount++;
          
        } catch (error) {
          console.log(`Failed to sync interest ${interest.id}:`, error.message);
        }
      }
      
      console.log(`✅ Synced ${syncedCount} interests to MySQL`);
      
    } finally {
      await connection.end();
    }
  }

  async performFullSync() {
    const startTime = new Date();
    console.log(`\n=== Starting PostgreSQL to MySQL Sync at ${startTime.toISOString()} ===`);
    
    try {
      // Test connections
      const connectionsOk = await this.testConnections();
      if (!connectionsOk) {
        console.log('❌ Connection tests failed, aborting sync');
        return false;
      }

      // Create/update table structures
      await this.createMySQLTables();

      // Sync data
      await this.syncUsers();
      await this.syncUserActivities();
      await this.syncInterests();

      const endTime = new Date();
      const duration = endTime - startTime;
      
      console.log(`✅ Full sync completed successfully in ${duration}ms`);
      console.log(`=== Sync finished at ${endTime.toISOString()} ===\n`);
      
      return true;
      
    } catch (error) {
      console.log('❌ Sync failed:', error.message);
      console.log(error.stack);
      return false;
    }
  }

  async startPeriodicSync(intervalMinutes = 10) {
    console.log(`Starting periodic sync every ${intervalMinutes} minute(s)...`);
    
    // Perform initial sync
    await this.performFullSync();
    
    // Schedule periodic syncs
    setInterval(async () => {
      await this.performFullSync();
    }, intervalMinutes * 60 * 1000);
    
    console.log('Periodic sync scheduled');
  }
}

// Export for use in other modules
export { PostgreSQLToMySQLSync };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const sync = new PostgreSQLToMySQLSync();
  
  if (process.argv.includes('--once')) {
    // Run once and exit
    sync.performFullSync().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    // Start periodic sync every 10 minutes
    sync.startPeriodicSync(10).catch(console.error);
  }
}