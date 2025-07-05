import { Pool as PgPool } from '@neondatabase/serverless';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import ws from 'ws';

// Configure neon for serverless
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

export class MySQLSyncService {
  private pgPool: PgPool;
  private pgDb: any;
  private mysqlConfig: mysql.ConnectionOptions;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.pgPool = new PgPool({ connectionString: process.env.DATABASE_URL });
    this.pgDb = drizzle({ client: this.pgPool, schema });
    
    this.mysqlConfig = {
      host: '147.93.107.184',
      port: 3306,
      user: 'replit-appv2',
      password: 'replit123',
      database: 'stapubox_db',
      connectTimeout: 15000
    };
  }

  async testMySQLConnection(): Promise<boolean> {
    try {
      const connection = await mysql.createConnection(this.mysqlConfig);
      await connection.execute('SELECT 1 as test');
      await connection.end();
      return true;
    } catch (error: any) {
      console.log('MySQL connection test failed:', error.message);
      return false;
    }
  }

  async syncAllData(): Promise<boolean> {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting MySQL sync...`);
    
    try {
      // Test MySQL connection first
      const mysqlAvailable = await this.testMySQLConnection();
      if (!mysqlAvailable) {
        console.log('❌ MySQL not available, skipping sync');
        return false;
      }

      const connection = await mysql.createConnection(this.mysqlConfig);
      
      try {
        // Get PostgreSQL data
        const [pgUsers, pgActivities, pgInterests] = await Promise.all([
          this.pgDb.select().from(schema.users),
          this.pgDb.select().from(schema.userActivities),
          this.pgDb.select().from(schema.interests)
        ]);

        console.log(`Found: ${pgUsers.length} users, ${pgActivities.length} activities, ${pgInterests.length} interests`);

        // Sync users
        for (const user of pgUsers) {
          await connection.execute(`
            INSERT INTO users (
              id, phoneNumber, name, email, userType, dateOfBirth, age, 
              workplace, bio, profilePhotoUrl, locationCoordinates, 
              locationName, city, societyArea, profileVisibility, 
              isActive, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name), email = VALUES(email), userType = VALUES(userType),
              dateOfBirth = VALUES(dateOfBirth), age = VALUES(age), workplace = VALUES(workplace),
              bio = VALUES(bio), profilePhotoUrl = VALUES(profilePhotoUrl),
              locationCoordinates = VALUES(locationCoordinates), locationName = VALUES(locationName),
              city = VALUES(city), societyArea = VALUES(societyArea),
              profileVisibility = VALUES(profileVisibility), isActive = VALUES(isActive),
              updatedAt = VALUES(updatedAt)
          `, [
            user.id, user.phoneNumber, user.name, user.email, user.userType,
            user.dateOfBirth, user.age, user.workplace, user.bio, user.profilePhotoUrl,
            user.locationCoordinates, user.locationName, user.city, user.societyArea,
            user.profileVisibility, user.isActive, user.createdAt, user.updatedAt
          ]);
        }

        // Sync activities (upsert approach)
        for (const activity of pgActivities) {
          await connection.execute(`
            INSERT INTO user_activities (id, userId, activityName, skillLevel, isPrimary, coachingExperienceYears, certifications)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              userId = VALUES(userId),
              activityName = VALUES(activityName),
              skillLevel = VALUES(skillLevel),
              isPrimary = VALUES(isPrimary),
              coachingExperienceYears = VALUES(coachingExperienceYears),
              certifications = VALUES(certifications)
          `, [
            activity.id, activity.userId, activity.activityName, activity.skillLevel,
            activity.isPrimary, activity.coachingExperienceYears, activity.certifications
          ]);
        }

        // Sync interests (upsert approach)
        for (const interest of pgInterests) {
          await connection.execute(`
            INSERT INTO interests (id, senderId, receiverId, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              senderId = VALUES(senderId),
              receiverId = VALUES(receiverId),
              status = VALUES(status),
              createdAt = VALUES(createdAt),
              updatedAt = VALUES(updatedAt)
          `, [
            interest.id, interest.senderId, interest.receiverId, interest.status,
            interest.createdAt, interest.updatedAt
          ]);
        }

        const duration = Date.now() - startTime;
        console.log(`✅ MySQL sync completed in ${duration}ms - ${pgUsers.length} users, ${pgActivities.length} activities, ${pgInterests.length} interests`);
        
        return true;
        
      } finally {
        await connection.end();
      }
      
    } catch (error: any) {
      console.log('❌ MySQL sync failed:', error.message);
      return false;
    }
  }

  startPeriodicSync(intervalMinutes = 10): void {
    console.log(`Starting MySQL sync every ${intervalMinutes} minutes...`);
    
    // Perform initial sync
    this.syncAllData();
    
    // Schedule periodic syncs
    this.syncInterval = setInterval(() => {
      this.syncAllData();
    }, intervalMinutes * 60 * 1000);
    
    console.log('✅ MySQL periodic sync scheduled');
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('MySQL periodic sync stopped');
    }
  }
}

// Create singleton instance
export const mysqlSyncService = new MySQLSyncService();