import mysql from 'mysql2/promise';
import { IStorage } from './storage';
import { 
  User, InsertUser, UserActivity, InsertUserActivity, Interest, InsertInterest,
  CareerApplication, InsertCareerApplication, InvestorInquiry, InsertInvestorInquiry,
  FeedItem, InsertFeedItem, FeedLike, Session, InsertSession,
  OtpVerification, InsertOtpVerification
} from '@shared/schema';

export class MySQLDirectStorage implements IStorage {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: '147.93.107.184',
      user: 'replit-app',
      password: '#S!t@pubox007!#',
      database: 'stapubox_replit',
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  private convertUserFromDb(row: any): User {
    return {
      id: row.id,
      phoneNumber: row.phone_number,
      name: row.name,
      userType: row.user_type as 'player' | 'coach',
      dateOfBirth: row.date_of_birth,
      gender: row.gender as 'male' | 'female' | 'other',
      profilePhotoUrl: row.profile_photo_url,
      city: row.city,
      societyArea: row.society_area,
      workplace: row.workplace,
      locationCoordinates: row.location_coordinates,
      locationName: row.location_name,
      isActive: Boolean(row.is_active),
      profileVisibility: row.profile_visibility as 'public' | 'interests_only',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private convertUserActivityFromDb(row: any): UserActivity {
    return {
      id: row.id,
      userId: row.user_id,
      activityName: row.activity_name,
      skillLevel: row.skill_level as 'beginner' | 'learner' | 'intermediate' | 'advanced' | 'expert',
      isPrimary: Boolean(row.is_primary),
      coachingExperienceYears: row.coaching_experience_years,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private convertInterestFromDb(row: any): Interest {
    return {
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      status: row.status as 'pending' | 'accepted' | 'declined' | 'withdrawn',
      createdAt: row.created_at,
      respondedAt: row.responded_at
    };
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      const users = rows as any[];
      return users.length > 0 ? this.convertUserFromDb(users[0]) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE phone_number = ?',
        [phoneNumber]
      );
      const users = rows as any[];
      return users.length > 0 ? this.convertUserFromDb(users[0]) : undefined;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [result] = await this.pool.execute(
        `INSERT INTO users (phone_number, name, user_type, date_of_birth, gender, 
         profile_photo_url, city, society_area, workplace, location_coordinates, 
         location_name, is_active, profile_visibility, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          user.phoneNumber, user.name, user.userType, user.dateOfBirth, user.gender,
          user.profilePhotoUrl, user.city, user.societyArea, user.workplace,
          user.locationCoordinates, user.locationName, user.isActive ?? true,
          user.profileVisibility ?? 'public'
        ]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      return await this.getUser(insertResult.insertId) as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const fields = [];
      const values = [];
      
      if (user.name !== undefined) { fields.push('name = ?'); values.push(user.name); }
      if (user.userType !== undefined) { fields.push('user_type = ?'); values.push(user.userType); }
      if (user.dateOfBirth !== undefined) { fields.push('date_of_birth = ?'); values.push(user.dateOfBirth); }
      if (user.gender !== undefined) { fields.push('gender = ?'); values.push(user.gender); }
      if (user.profilePhotoUrl !== undefined) { fields.push('profile_photo_url = ?'); values.push(user.profilePhotoUrl); }
      if (user.city !== undefined) { fields.push('city = ?'); values.push(user.city); }
      if (user.societyArea !== undefined) { fields.push('society_area = ?'); values.push(user.societyArea); }
      if (user.workplace !== undefined) { fields.push('workplace = ?'); values.push(user.workplace); }
      if (user.locationCoordinates !== undefined) { fields.push('location_coordinates = ?'); values.push(user.locationCoordinates); }
      if (user.locationName !== undefined) { fields.push('location_name = ?'); values.push(user.locationName); }
      if (user.isActive !== undefined) { fields.push('is_active = ?'); values.push(user.isActive); }
      if (user.profileVisibility !== undefined) { fields.push('profile_visibility = ?'); values.push(user.profileVisibility); }
      
      fields.push('updated_at = NOW()');
      values.push(id);
      
      await this.pool.execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getUser(id);
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await this.pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async searchUsers(filters: {
    userType?: string;
    city?: string;
    societyArea?: string;
    activityName?: string;
    skillLevel?: string;
    excludeUserIds?: number[];
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    try {
      let sql = `
        SELECT DISTINCT u.* FROM users u 
        LEFT JOIN user_activities ua ON u.id = ua.user_id 
        WHERE u.is_active = 1
      `;
      const params: any[] = [];
      
      if (filters.userType) {
        sql += ' AND u.user_type = ?';
        params.push(filters.userType);
      }
      if (filters.city) {
        sql += ' AND u.city = ?';
        params.push(filters.city);
      }
      if (filters.societyArea) {
        sql += ' AND u.society_area = ?';
        params.push(filters.societyArea);
      }
      if (filters.activityName) {
        sql += ' AND ua.activity_name = ?';
        params.push(filters.activityName);
      }
      if (filters.skillLevel) {
        sql += ' AND ua.skill_level = ?';
        params.push(filters.skillLevel);
      }
      if (filters.excludeUserIds && filters.excludeUserIds.length > 0) {
        sql += ` AND u.id NOT IN (${filters.excludeUserIds.map(() => '?').join(',')})`;
        params.push(...filters.excludeUserIds);
      }
      
      sql += ' ORDER BY u.created_at DESC';
      
      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
        if (filters.offset) {
          sql += ' OFFSET ?';
          params.push(filters.offset);
        }
      }
      
      const [rows] = await this.pool.execute(sql, params);
      return (rows as any[]).map(row => this.convertUserFromDb(row));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // User activities
  async getUserActivities(userId: number): Promise<UserActivity[]> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM user_activities WHERE user_id = ?',
        [userId]
      );
      return (rows as any[]).map(row => this.convertUserActivityFromDb(row));
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    try {
      const [result] = await this.pool.execute(
        `INSERT INTO user_activities (user_id, activity_name, skill_level, is_primary, 
         coaching_experience_years, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          activity.userId, activity.activityName, activity.skillLevel,
          activity.isPrimary, activity.coachingExperienceYears
        ]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const [rows] = await this.pool.execute(
        'SELECT * FROM user_activities WHERE id = ?',
        [insertResult.insertId]
      );
      return this.convertUserActivityFromDb((rows as any[])[0]);
    } catch (error) {
      console.error('Error creating user activity:', error);
      throw error;
    }
  }

  async updateUserActivity(id: number, activity: Partial<InsertUserActivity>): Promise<UserActivity | undefined> {
    try {
      const fields = [];
      const values = [];
      
      if (activity.activityName !== undefined) { fields.push('activity_name = ?'); values.push(activity.activityName); }
      if (activity.skillLevel !== undefined) { fields.push('skill_level = ?'); values.push(activity.skillLevel); }
      if (activity.isPrimary !== undefined) { fields.push('is_primary = ?'); values.push(activity.isPrimary); }
      if (activity.coachingExperienceYears !== undefined) { fields.push('coaching_experience_years = ?'); values.push(activity.coachingExperienceYears); }
      
      fields.push('updated_at = NOW()');
      values.push(id);
      
      await this.pool.execute(
        `UPDATE user_activities SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      const [rows] = await this.pool.execute(
        'SELECT * FROM user_activities WHERE id = ?',
        [id]
      );
      const activities = rows as any[];
      return activities.length > 0 ? this.convertUserActivityFromDb(activities[0]) : undefined;
    } catch (error) {
      console.error('Error updating user activity:', error);
      return undefined;
    }
  }

  async deleteUserActivities(userId: number): Promise<boolean> {
    try {
      await this.pool.execute('DELETE FROM user_activities WHERE user_id = ?', [userId]);
      return true;
    } catch (error) {
      console.error('Error deleting user activities:', error);
      return false;
    }
  }

  // Interests
  async getInterest(id: number): Promise<Interest | undefined> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM interests WHERE id = ?',
        [id]
      );
      const interests = rows as any[];
      return interests.length > 0 ? this.convertInterestFromDb(interests[0]) : undefined;
    } catch (error) {
      console.error('Error getting interest:', error);
      return undefined;
    }
  }

  async getInterestsBySender(senderId: number): Promise<Interest[]> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM interests WHERE sender_id = ?',
        [senderId]
      );
      return (rows as any[]).map(row => this.convertInterestFromDb(row));
    } catch (error) {
      console.error('Error getting interests by sender:', error);
      return [];
    }
  }

  async getInterestsByReceiver(receiverId: number): Promise<Interest[]> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM interests WHERE receiver_id = ?',
        [receiverId]
      );
      return (rows as any[]).map(row => this.convertInterestFromDb(row));
    } catch (error) {
      console.error('Error getting interests by receiver:', error);
      return [];
    }
  }

  async getInterestByUsers(senderId: number, receiverId: number): Promise<Interest | undefined> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM interests WHERE sender_id = ? AND receiver_id = ?',
        [senderId, receiverId]
      );
      const interests = rows as any[];
      return interests.length > 0 ? this.convertInterestFromDb(interests[0]) : undefined;
    } catch (error) {
      console.error('Error getting interest by users:', error);
      return undefined;
    }
  }

  async createInterest(interest: InsertInterest): Promise<Interest> {
    try {
      const [result] = await this.pool.execute(
        `INSERT INTO interests (sender_id, receiver_id, status, created_at, responded_at) 
         VALUES (?, ?, ?, NOW(), ?)`,
        [interest.senderId, interest.receiverId, interest.status, interest.respondedAt]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const [rows] = await this.pool.execute(
        'SELECT * FROM interests WHERE id = ?',
        [insertResult.insertId]
      );
      return this.convertInterestFromDb((rows as any[])[0]);
    } catch (error) {
      console.error('Error creating interest:', error);
      throw error;
    }
  }

  async updateInterest(id: number, interest: Partial<Interest>): Promise<Interest | undefined> {
    try {
      const fields = [];
      const values = [];
      
      if (interest.status !== undefined) { fields.push('status = ?'); values.push(interest.status); }
      if (interest.respondedAt !== undefined) { fields.push('responded_at = ?'); values.push(interest.respondedAt); }
      
      values.push(id);
      
      await this.pool.execute(
        `UPDATE interests SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getInterest(id);
    } catch (error) {
      console.error('Error updating interest:', error);
      return undefined;
    }
  }

  async countTodayInterestsBySender(senderId: number): Promise<number> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT COUNT(*) as count FROM interests WHERE sender_id = ? AND DATE(created_at) = CURDATE()',
        [senderId]
      );
      return (rows as any[])[0].count;
    } catch (error) {
      console.error('Error counting today interests:', error);
      return 0;
    }
  }

  async getFilterOptions(userType?: string): Promise<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }> {
    try {
      const [cityRows] = await this.pool.execute(
        'SELECT DISTINCT city FROM users WHERE city IS NOT NULL AND city != "" ORDER BY city'
      );
      const [areaRows] = await this.pool.execute(
        'SELECT DISTINCT society_area FROM users WHERE society_area IS NOT NULL AND society_area != "" ORDER BY society_area'
      );
      const [activityRows] = await this.pool.execute(
        'SELECT DISTINCT activity_name FROM user_activities ORDER BY activity_name'
      );
      const [skillRows] = await this.pool.execute(
        'SELECT DISTINCT skill_level FROM user_activities ORDER BY skill_level'
      );
      const [workplaceRows] = await this.pool.execute(
        'SELECT DISTINCT workplace FROM users WHERE workplace IS NOT NULL AND workplace != "" ORDER BY workplace'
      );
      
      return {
        cities: (cityRows as any[]).map(r => r.city),
        societyAreas: (areaRows as any[]).map(r => r.society_area),
        activities: (activityRows as any[]).map(r => r.activity_name),
        skillLevels: (skillRows as any[]).map(r => r.skill_level),
        workplaces: (workplaceRows as any[]).map(r => r.workplace)
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        cities: [],
        societyAreas: [],
        activities: [],
        skillLevels: [],
        workplaces: []
      };
    }
  }

  // Session management
  async createSession(session: InsertSession): Promise<Session> {
    try {
      const [result] = await this.pool.execute(
        `INSERT INTO sessions (session_token, phone_number, user_id, session_type, expires_at, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          session.sessionToken,
          session.phoneNumber,
          session.userId,
          session.sessionType,
          session.expiresAt
        ]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const [rows] = await this.pool.execute(
        'SELECT * FROM sessions WHERE id = ?',
        [insertResult.insertId]
      );
      
      const sessionRow = (rows as any[])[0];
      return {
        id: sessionRow.id,
        sessionToken: sessionRow.session_token,
        phoneNumber: sessionRow.phone_number,
        userId: sessionRow.user_id,
        sessionType: sessionRow.session_type as 'otp_verified' | 'profile_complete',
        expiresAt: sessionRow.expires_at,
        createdAt: sessionRow.created_at
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionToken: string): Promise<Session | undefined> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM sessions WHERE session_token = ? AND expires_at > NOW()',
        [sessionToken]
      );
      
      const sessions = rows as any[];
      if (sessions.length === 0) return undefined;
      
      const session = sessions[0];
      return {
        id: session.id,
        sessionToken: session.session_token,
        phoneNumber: session.phone_number,
        userId: session.user_id,
        sessionType: session.session_type as 'otp_verified' | 'profile_complete',
        expiresAt: session.expires_at,
        createdAt: session.created_at
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return undefined;
    }
  }

  async getSessionByPhoneNumber(phoneNumber: string): Promise<Session | undefined> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM sessions WHERE phone_number = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [phoneNumber]
      );
      
      const sessions = rows as any[];
      if (sessions.length === 0) return undefined;
      
      const session = sessions[0];
      return {
        id: session.id,
        sessionToken: session.session_token,
        phoneNumber: session.phone_number,
        userId: session.user_id,
        sessionType: session.session_type as 'otp_verified' | 'profile_complete',
        expiresAt: session.expires_at,
        createdAt: session.created_at
      };
    } catch (error) {
      console.error('Error getting session by phone:', error);
      return undefined;
    }
  }

  async updateSession(sessionToken: string, updates: Partial<Session>): Promise<Session | undefined> {
    try {
      const fields = [];
      const values = [];
      
      if (updates.userId !== undefined) { fields.push('user_id = ?'); values.push(updates.userId); }
      if (updates.sessionType !== undefined) { fields.push('session_type = ?'); values.push(updates.sessionType); }
      if (updates.expiresAt !== undefined) { fields.push('expires_at = ?'); values.push(updates.expiresAt); }
      
      if (fields.length === 0) return this.getSession(sessionToken);
      
      values.push(sessionToken);
      
      await this.pool.execute(
        `UPDATE sessions SET ${fields.join(', ')} WHERE session_token = ?`,
        values
      );
      
      return this.getSession(sessionToken);
    } catch (error) {
      console.error('Error updating session:', error);
      return undefined;
    }
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    try {
      await this.pool.execute('DELETE FROM sessions WHERE session_token = ?', [sessionToken]);
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  async deleteExpiredSessions(): Promise<boolean> {
    try {
      await this.pool.execute('DELETE FROM sessions WHERE expires_at < NOW()');
      return true;
    } catch (error) {
      console.error('Error deleting expired sessions:', error);
      return false;
    }
  }

  // OTP verification
  async createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification> {
    try {
      const [result] = await this.pool.execute(
        `INSERT INTO otp_verifications (phone_number, otp, expires_at, verified, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          otp.phoneNumber,
          otp.otp,
          otp.expiresAt,
          otp.verified ?? false
        ]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const [rows] = await this.pool.execute(
        'SELECT * FROM otp_verifications WHERE id = ?',
        [insertResult.insertId]
      );
      
      const otpRow = (rows as any[])[0];
      return {
        id: otpRow.id,
        phoneNumber: otpRow.phone_number,
        otp: otpRow.otp,
        expiresAt: otpRow.expires_at,
        verified: Boolean(otpRow.verified),
        createdAt: otpRow.created_at
      };
    } catch (error) {
      console.error('Error creating OTP verification:', error);
      throw error;
    }
  }

  async getOtpVerification(phoneNumber: string, otp: string): Promise<OtpVerification | undefined> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM otp_verifications WHERE phone_number = ? AND otp = ? AND expires_at > NOW() AND verified = 0',
        [phoneNumber, otp]
      );
      
      const otps = rows as any[];
      if (otps.length === 0) return undefined;
      
      const otpRow = otps[0];
      return {
        id: otpRow.id,
        phoneNumber: otpRow.phone_number,
        otp: otpRow.otp,
        expiresAt: otpRow.expires_at,
        verified: Boolean(otpRow.verified),
        createdAt: otpRow.created_at
      };
    } catch (error) {
      console.error('Error getting OTP verification:', error);
      return undefined;
    }
  }

  async markOtpAsVerified(id: number): Promise<boolean> {
    try {
      await this.pool.execute('UPDATE otp_verifications SET verified = 1 WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error marking OTP as verified:', error);
      return false;
    }
  }

  async deleteExpiredOtps(): Promise<boolean> {
    try {
      await this.pool.execute('DELETE FROM otp_verifications WHERE expires_at < NOW()');
      return true;
    } catch (error) {
      console.error('Error deleting expired OTPs:', error);
      return false;
    }
  }

  // Feed system (basic implementations)
  async getFeedItems(limit = 20, offset = 0): Promise<FeedItem[]> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM feed_items ORDER BY published_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return (rows as any[]).map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        authorId: row.author_id,
        publishedAt: row.published_at,
        likeCount: row.like_count || 0,
        tags: row.tags ? JSON.parse(row.tags) : []
      }));
    } catch (error) {
      console.error('Error getting feed items:', error);
      return [];
    }
  }

  async createFeedItem(item: InsertFeedItem): Promise<FeedItem> {
    throw new Error('Feed item creation not yet implemented');
  }

  async getFeedLike(userId: number, feedItemId: number): Promise<FeedLike | undefined> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM feed_likes WHERE user_id = ? AND feed_item_id = ?',
        [userId, feedItemId]
      );
      const likes = rows as any[];
      if (likes.length === 0) return undefined;
      
      return {
        id: likes[0].id,
        userId: likes[0].user_id,
        feedItemId: likes[0].feed_item_id,
        createdAt: likes[0].created_at
      };
    } catch (error) {
      console.error('Error getting feed like:', error);
      return undefined;
    }
  }

  async createFeedLike(userId: number, feedItemId: number): Promise<FeedLike> {
    try {
      const [result] = await this.pool.execute(
        'INSERT INTO feed_likes (user_id, feed_item_id, created_at) VALUES (?, ?, NOW())',
        [userId, feedItemId]
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      const [rows] = await this.pool.execute(
        'SELECT * FROM feed_likes WHERE id = ?',
        [insertResult.insertId]
      );
      
      const like = (rows as any[])[0];
      return {
        id: like.id,
        userId: like.user_id,
        feedItemId: like.feed_item_id,
        createdAt: like.created_at
      };
    } catch (error) {
      console.error('Error creating feed like:', error);
      throw error;
    }
  }

  async deleteFeedLike(userId: number, feedItemId: number): Promise<boolean> {
    try {
      await this.pool.execute(
        'DELETE FROM feed_likes WHERE user_id = ? AND feed_item_id = ?',
        [userId, feedItemId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting feed like:', error);
      return false;
    }
  }

  async updateFeedItemLikes(feedItemId: number, increment: number): Promise<boolean> {
    try {
      await this.pool.execute(
        'UPDATE feed_items SET like_count = GREATEST(0, like_count + ?) WHERE id = ?',
        [increment, feedItemId]
      );
      return true;
    } catch (error) {
      console.error('Error updating feed item likes:', error);
      return false;
    }
  }

  // Career and investor applications (basic implementations)
  async createCareerApplication(application: InsertCareerApplication): Promise<CareerApplication> {
    throw new Error('Career applications not yet implemented');
  }

  async getCareerApplications(): Promise<CareerApplication[]> {
    return [];
  }

  async createInvestorInquiry(inquiry: InsertInvestorInquiry): Promise<InvestorInquiry> {
    throw new Error('Investor inquiries not yet implemented');
  }

  async getInvestorInquiries(): Promise<InvestorInquiry[]> {
    return [];
  }
}