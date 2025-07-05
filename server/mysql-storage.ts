import mysql from 'mysql2/promise';
import { 
  User, InsertUser, UserActivity, InsertUserActivity, Interest, InsertInterest,
  CareerApplication, InsertCareerApplication, InvestorInquiry, InsertInvestorInquiry,
  FeedItem, InsertFeedItem, FeedLike, Session, InsertSession,
  OtpVerification, InsertOtpVerification
} from '../shared/schema.js';
import { IStorage } from './storage.js';

export class MySQLStorage implements IStorage {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: '147.93.107.184',
      port: 3306,
      user: 'replit-app',
      password: '#S!t@pubox007!#',
      database: 'stapubox_replit',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 60000
    });
    
    this.initializeTables();
  }

  private async initializeTables() {
    const connection = await this.pool.getConnection();
    
    try {
      // Create users table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          phone_number VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          user_type ENUM('player', 'coach') NOT NULL,
          date_of_birth DATE,
          gender ENUM('male', 'female', 'other'),
          bio TEXT,
          profile_photo_url VARCHAR(500),
          city VARCHAR(255),
          society_area VARCHAR(255),
          workplace VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create user_activities table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_activities (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          activity_name VARCHAR(255) NOT NULL,
          skill_level ENUM('beginner', 'learner', 'intermediate', 'advanced', 'expert') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create interests table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS interests (
          id INT PRIMARY KEY AUTO_INCREMENT,
          sender_id INT NOT NULL,
          receiver_id INT NOT NULL,
          status ENUM('pending', 'accepted', 'declined', 'withdrawn') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_interest (sender_id, receiver_id)
        )
      `);

      // Create career_applications table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS career_applications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          position VARCHAR(255) NOT NULL,
          experience_years INT NOT NULL,
          skills TEXT NOT NULL,
          resume_url VARCHAR(500),
          cover_letter TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create investor_inquiries table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS investor_inquiries (
          id INT PRIMARY KEY AUTO_INCREMENT,
          company_name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          investment_type VARCHAR(255) NOT NULL,
          investment_amount VARCHAR(255) NOT NULL,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create feed_items table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS feed_items (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          content TEXT NOT NULL,
          image_url VARCHAR(500),
          likes_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create feed_likes table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS feed_likes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          feed_item_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (feed_item_id) REFERENCES feed_items(id) ON DELETE CASCADE,
          UNIQUE KEY unique_like (user_id, feed_item_id)
        )
      `);

      // Create sessions table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          phone_number VARCHAR(20) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          user_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create otp_verifications table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS otp_verifications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          phone_number VARCHAR(20) NOT NULL,
          otp VARCHAR(10) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('MySQL tables initialized successfully');
    } catch (error) {
      console.error('Error initializing MySQL tables:', error);
    } finally {
      connection.release();
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    const users = rows as any[];
    return users[0] ? this.convertUserFromDb(users[0]) : undefined;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE phone_number = ?',
      [phoneNumber]
    );
    const users = rows as any[];
    return users[0] ? this.convertUserFromDb(users[0]) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await this.pool.execute(
      `INSERT INTO users (phone_number, name, user_type, date_of_birth, gender, bio, profile_photo_url, city, society_area, workplace)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.phoneNumber, user.name, user.userType, user.dateOfBirth,
        user.gender, user.bio, user.profilePhotoUrl, user.city,
        user.societyArea, user.workplace
      ]
    );
    const insertResult = result as any;
    return this.getUser(insertResult.insertId) as Promise<User>;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const fields = [];
    const values = [];
    
    if (user.name !== undefined) { fields.push('name = ?'); values.push(user.name); }
    if (user.userType !== undefined) { fields.push('user_type = ?'); values.push(user.userType); }
    if (user.dateOfBirth !== undefined) { fields.push('date_of_birth = ?'); values.push(user.dateOfBirth); }
    if (user.gender !== undefined) { fields.push('gender = ?'); values.push(user.gender); }
    if (user.bio !== undefined) { fields.push('bio = ?'); values.push(user.bio); }
    if (user.profilePhotoUrl !== undefined) { fields.push('profile_photo_url = ?'); values.push(user.profilePhotoUrl); }
    if (user.city !== undefined) { fields.push('city = ?'); values.push(user.city); }
    if (user.societyArea !== undefined) { fields.push('society_area = ?'); values.push(user.societyArea); }
    if (user.workplace !== undefined) { fields.push('workplace = ?'); values.push(user.workplace); }

    if (fields.length === 0) return this.getUser(id);

    values.push(id);
    await this.pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getUser(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    const [result] = await this.pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async searchUsers(filters: {
    userType?: string;
    city?: string;
    societyArea?: string;
    activityName?: string;
    skillLevel?: string;
    workplace?: string;
    minAge?: number;
    maxAge?: number;
    excludeUserId?: number;
  }): Promise<User[]> {
    let query = `
      SELECT DISTINCT u.* FROM users u
      LEFT JOIN user_activities ua ON u.id = ua.user_id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (filters.userType && filters.userType !== 'all') {
      query += ' AND u.user_type = ?';
      queryParams.push(filters.userType);
    }

    if (filters.city) {
      query += ' AND u.city LIKE ?';
      queryParams.push(`%${filters.city}%`);
    }

    if (filters.societyArea) {
      query += ' AND u.society_area LIKE ?';
      queryParams.push(`%${filters.societyArea}%`);
    }

    if (filters.workplace) {
      query += ' AND u.workplace LIKE ?';
      queryParams.push(`%${filters.workplace}%`);
    }

    if (filters.activityName) {
      query += ' AND ua.activity_name = ?';
      queryParams.push(filters.activityName);
    }

    if (filters.skillLevel) {
      query += ' AND ua.skill_level = ?';
      queryParams.push(filters.skillLevel);
    }

    if (filters.excludeUserId) {
      query += ' AND u.id != ?';
      queryParams.push(filters.excludeUserId);
    }

    if (filters.minAge || filters.maxAge) {
      if (filters.minAge) {
        query += ' AND DATEDIFF(CURDATE(), u.date_of_birth) >= ?';
        queryParams.push(filters.minAge * 365);
      }
      if (filters.maxAge) {
        query += ' AND DATEDIFF(CURDATE(), u.date_of_birth) <= ?';
        queryParams.push(filters.maxAge * 365);
      }
    }

    const [rows] = await this.pool.execute(query, queryParams);
    return (rows as any[]).map(row => this.convertUserFromDb(row));
  }

  // Helper method to convert database row to User type
  private convertUserFromDb(row: any): User {
    return {
      id: row.id,
      phoneNumber: row.phone_number,
      name: row.name,
      userType: row.user_type,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      bio: row.bio,
      profilePhotoUrl: row.profile_photo_url,
      city: row.city,
      societyArea: row.society_area,
      workplace: row.workplace,
      createdAt: row.created_at
    };
  }

  // User Activities methods
  async getUserActivities(userId: number): Promise<UserActivity[]> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM user_activities WHERE user_id = ?',
      [userId]
    );
    return (rows as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      activityName: row.activity_name,
      skillLevel: row.skill_level,
      createdAt: row.created_at
    }));
  }

  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [result] = await this.pool.execute(
      'INSERT INTO user_activities (user_id, activity_name, skill_level) VALUES (?, ?, ?)',
      [activity.userId, activity.activityName, activity.skillLevel]
    );
    const insertResult = result as any;
    const [rows] = await this.pool.execute(
      'SELECT * FROM user_activities WHERE id = ?',
      [insertResult.insertId]
    );
    const row = (rows as any[])[0];
    return {
      id: row.id,
      userId: row.user_id,
      activityName: row.activity_name,
      skillLevel: row.skill_level,
      createdAt: row.created_at
    };
  }

  async updateUserActivity(id: number, activity: Partial<InsertUserActivity>): Promise<UserActivity | undefined> {
    const fields = [];
    const values = [];
    
    if (activity.activityName !== undefined) { fields.push('activity_name = ?'); values.push(activity.activityName); }
    if (activity.skillLevel !== undefined) { fields.push('skill_level = ?'); values.push(activity.skillLevel); }

    if (fields.length === 0) {
      const [rows] = await this.pool.execute('SELECT * FROM user_activities WHERE id = ?', [id]);
      const row = (rows as any[])[0];
      return row ? {
        id: row.id,
        userId: row.user_id,
        activityName: row.activity_name,
        skillLevel: row.skill_level,
        createdAt: row.created_at
      } : undefined;
    }

    values.push(id);
    await this.pool.execute(
      `UPDATE user_activities SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await this.pool.execute('SELECT * FROM user_activities WHERE id = ?', [id]);
    const row = (rows as any[])[0];
    return row ? {
      id: row.id,
      userId: row.user_id,
      activityName: row.activity_name,
      skillLevel: row.skill_level,
      createdAt: row.created_at
    } : undefined;
  }

  async deleteUserActivities(userId: number): Promise<boolean> {
    const [result] = await this.pool.execute('DELETE FROM user_activities WHERE user_id = ?', [userId]);
    return (result as any).affectedRows >= 0;
  }

  // Interest methods
  async getInterest(id: number): Promise<Interest | undefined> {
    const [rows] = await this.pool.execute('SELECT * FROM interests WHERE id = ?', [id]);
    const interests = rows as any[];
    return interests[0] ? this.convertInterestFromDb(interests[0]) : undefined;
  }

  async getInterestsBySender(senderId: number): Promise<Interest[]> {
    const [rows] = await this.pool.execute('SELECT * FROM interests WHERE sender_id = ?', [senderId]);
    return (rows as any[]).map(row => this.convertInterestFromDb(row));
  }

  async getInterestsByReceiver(receiverId: number): Promise<Interest[]> {
    const [rows] = await this.pool.execute('SELECT * FROM interests WHERE receiver_id = ?', [receiverId]);
    return (rows as any[]).map(row => this.convertInterestFromDb(row));
  }

  async getInterestByUsers(senderId: number, receiverId: number): Promise<Interest | undefined> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM interests WHERE sender_id = ? AND receiver_id = ?',
      [senderId, receiverId]
    );
    const interests = rows as any[];
    return interests[0] ? this.convertInterestFromDb(interests[0]) : undefined;
  }

  async createInterest(interest: InsertInterest): Promise<Interest> {
    const [result] = await this.pool.execute(
      'INSERT INTO interests (sender_id, receiver_id, status) VALUES (?, ?, ?)',
      [interest.senderId, interest.receiverId, interest.status || 'pending']
    );
    const insertResult = result as any;
    return this.getInterest(insertResult.insertId) as Promise<Interest>;
  }

  async updateInterest(id: number, interest: Partial<Interest>): Promise<Interest | undefined> {
    const fields = [];
    const values = [];
    
    if (interest.status !== undefined) { fields.push('status = ?'); values.push(interest.status); }

    if (fields.length === 0) return this.getInterest(id);

    values.push(id);
    await this.pool.execute(
      `UPDATE interests SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return this.getInterest(id);
  }

  async countTodayInterestsBySender(senderId: number): Promise<number> {
    const [rows] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM interests WHERE sender_id = ? AND DATE(created_at) = CURDATE()',
      [senderId]
    );
    return (rows as any[])[0].count;
  }

  private convertInterestFromDb(row: any): Interest {
    return {
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Career Applications
  async createCareerApplication(application: InsertCareerApplication): Promise<CareerApplication> {
    const [result] = await this.pool.execute(
      `INSERT INTO career_applications (full_name, email, phone, position, experience_years, skills, resume_url, cover_letter)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        application.fullName, application.email, application.phone, application.position,
        application.experienceYears, application.skills, application.resumeUrl, application.coverLetter
      ]
    );
    const insertResult = result as any;
    const [rows] = await this.pool.execute('SELECT * FROM career_applications WHERE id = ?', [insertResult.insertId]);
    const row = (rows as any[])[0];
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      position: row.position,
      experienceYears: row.experience_years,
      skills: row.skills,
      resumeUrl: row.resume_url,
      coverLetter: row.cover_letter,
      createdAt: row.created_at
    };
  }

  async getCareerApplications(): Promise<CareerApplication[]> {
    const [rows] = await this.pool.execute('SELECT * FROM career_applications ORDER BY created_at DESC');
    return (rows as any[]).map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      position: row.position,
      experienceYears: row.experience_years,
      skills: row.skills,
      resumeUrl: row.resume_url,
      coverLetter: row.cover_letter,
      createdAt: row.created_at
    }));
  }

  // Investor Inquiries
  async createInvestorInquiry(inquiry: InsertInvestorInquiry): Promise<InvestorInquiry> {
    const [result] = await this.pool.execute(
      `INSERT INTO investor_inquiries (company_name, contact_person, email, phone, investment_type, investment_amount, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        inquiry.companyName, inquiry.contactPerson, inquiry.email, inquiry.phone,
        inquiry.investmentType, inquiry.investmentAmount, inquiry.message
      ]
    );
    const insertResult = result as any;
    const [rows] = await this.pool.execute('SELECT * FROM investor_inquiries WHERE id = ?', [insertResult.insertId]);
    const row = (rows as any[])[0];
    return {
      id: row.id,
      companyName: row.company_name,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      investmentType: row.investment_type,
      investmentAmount: row.investment_amount,
      message: row.message,
      createdAt: row.created_at
    };
  }

  async getInvestorInquiries(): Promise<InvestorInquiry[]> {
    const [rows] = await this.pool.execute('SELECT * FROM investor_inquiries ORDER BY created_at DESC');
    return (rows as any[]).map(row => ({
      id: row.id,
      companyName: row.company_name,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      investmentType: row.investment_type,
      investmentAmount: row.investment_amount,
      message: row.message,
      createdAt: row.created_at
    }));
  }

  // Feed Items
  async getFeedItems(limit = 20, offset = 0): Promise<FeedItem[]> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM feed_items ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return (rows as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      imageUrl: row.image_url,
      likesCount: row.likes_count,
      createdAt: row.created_at
    }));
  }

  async createFeedItem(item: InsertFeedItem): Promise<FeedItem> {
    const [result] = await this.pool.execute(
      'INSERT INTO feed_items (user_id, content, image_url) VALUES (?, ?, ?)',
      [item.userId, item.content, item.imageUrl]
    );
    const insertResult = result as any;
    const [rows] = await this.pool.execute('SELECT * FROM feed_items WHERE id = ?', [insertResult.insertId]);
    const row = (rows as any[])[0];
    return {
      id: row.id,
      userId: row.user_id,
      content: row.content,
      imageUrl: row.image_url,
      likesCount: row.likes_count,
      createdAt: row.created_at
    };
  }

  async getFeedLike(userId: number, feedItemId: number): Promise<FeedLike | undefined> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM feed_likes WHERE user_id = ? AND feed_item_id = ?',
      [userId, feedItemId]
    );
    const likes = rows as any[];
    return likes[0] ? {
      id: likes[0].id,
      userId: likes[0].user_id,
      feedItemId: likes[0].feed_item_id,
      createdAt: likes[0].created_at
    } : undefined;
  }

  async createFeedLike(userId: number, feedItemId: number): Promise<FeedLike> {
    const [result] = await this.pool.execute(
      'INSERT INTO feed_likes (user_id, feed_item_id) VALUES (?, ?)',
      [userId, feedItemId]
    );
    const insertResult = result as any;
    const [rows] = await this.pool.execute('SELECT * FROM feed_likes WHERE id = ?', [insertResult.insertId]);
    const row = (rows as any[])[0];
    return {
      id: row.id,
      userId: row.user_id,
      feedItemId: row.feed_item_id,
      createdAt: row.created_at
    };
  }

  async deleteFeedLike(userId: number, feedItemId: number): Promise<boolean> {
    const [result] = await this.pool.execute(
      'DELETE FROM feed_likes WHERE user_id = ? AND feed_item_id = ?',
      [userId, feedItemId]
    );
    return (result as any).affectedRows > 0;
  }

  async updateFeedItemLikes(feedItemId: number, increment: number): Promise<boolean> {
    const [result] = await this.pool.execute(
      'UPDATE feed_items SET likes_count = likes_count + ? WHERE id = ?',
      [increment, feedItemId]
    );
    return (result as any).affectedRows > 0;
  }

  // Sessions
  async createSession(session: InsertSession): Promise<Session> {
    const [result] = await this.pool.execute(
      'INSERT INTO sessions (session_token, phone_number, expires_at, user_id) VALUES (?, ?, ?, ?)',
      [session.sessionToken, session.phoneNumber, session.expiresAt, session.userId]
    );
    const insertResult = result as any;
    const [rows] = await this.pool.execute('SELECT * FROM sessions WHERE id = ?', [insertResult.insertId]);
    const row = (rows as any[])[0];
    return {
      id: row.id,
      sessionToken: row.session_token,
      phoneNumber: row.phone_number,
      expiresAt: row.expires_at,
      userId: row.user_id,
      createdAt: row.created_at
    };
  }

  async getSession(sessionToken: string): Promise<Session | undefined> {
    const [rows] = await this.pool.execute('SELECT * FROM sessions WHERE session_token = ?', [sessionToken]);
    const sessions = rows as any[];
    return sessions[0] ? {
      id: sessions[0].id,
      sessionToken: sessions[0].session_token,
      phoneNumber: sessions[0].phone_number,
      expiresAt: sessions[0].expires_at,
      userId: sessions[0].user_id,
      createdAt: sessions[0].created_at
    } : undefined;
  }

  async getSessionByPhoneNumber(phoneNumber: string): Promise<Session | undefined> {
    const [rows] = await this.pool.execute('SELECT * FROM sessions WHERE phone_number = ?', [phoneNumber]);
    const sessions = rows as any[];
    return sessions[0] ? {
      id: sessions[0].id,
      sessionToken: sessions[0].session_token,
      phoneNumber: sessions[0].phone_number,
      expiresAt: sessions[0].expires_at,
      userId: sessions[0].user_id,
      createdAt: sessions[0].created_at
    } : undefined;
  }

  async updateSession(sessionToken: string, updates: Partial<Session>): Promise<Session | undefined> {
    const fields = [];
    const values = [];
    
    if (updates.expiresAt !== undefined) { fields.push('expires_at = ?'); values.push(updates.expiresAt); }
    if (updates.userId !== undefined) { fields.push('user_id = ?'); values.push(updates.userId); }

    if (fields.length === 0) return this.getSession(sessionToken);

    values.push(sessionToken);
    await this.pool.execute(
      `UPDATE sessions SET ${fields.join(', ')} WHERE session_token = ?`,
      values
    );
    
    return this.getSession(sessionToken);
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    const [result] = await this.pool.execute('DELETE FROM sessions WHERE session_token = ?', [sessionToken]);
    return (result as any).affectedRows > 0;
  }

  async deleteExpiredSessions(): Promise<boolean> {
    const [result] = await this.pool.execute('DELETE FROM sessions WHERE expires_at < NOW()');
    return (result as any).affectedRows >= 0;
  }

  // Filter Options
  async getFilterOptions(userType?: string): Promise<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }> {
    let userQuery = 'SELECT DISTINCT city, society_area, workplace FROM users WHERE city IS NOT NULL OR society_area IS NOT NULL OR workplace IS NOT NULL';
    const userParams: any[] = [];
    
    if (userType && userType !== 'all') {
      userQuery += ' AND user_type = ?';
      userParams.push(userType);
    }

    const [userRows] = await this.pool.execute(userQuery, userParams);
    const users = userRows as any[];

    const cities = [...new Set(users.map(u => u.city).filter(Boolean))];
    const societyAreas = [...new Set(users.map(u => u.society_area).filter(Boolean))];
    const workplaces = [...new Set(users.map(u => u.workplace).filter(Boolean))];

    let activityQuery = 'SELECT DISTINCT activity_name, skill_level FROM user_activities ua';
    if (userType && userType !== 'all') {
      activityQuery += ' JOIN users u ON ua.user_id = u.id WHERE u.user_type = ?';
    }

    const [activityRows] = await this.pool.execute(
      activityQuery, 
      userType && userType !== 'all' ? [userType] : []
    );
    const activities = [...new Set((activityRows as any[]).map(a => a.activity_name))];
    const skillLevels = [...new Set((activityRows as any[]).map(a => a.skill_level))];

    return {
      cities,
      societyAreas,
      activities,
      skillLevels,
      workplaces
    };
  }

  // OTP Verifications
  async createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification> {
    const [result] = await this.pool.execute(
      'INSERT INTO otp_verifications (phone_number, otp, expires_at) VALUES (?, ?, ?)',
      [otp.phoneNumber, otp.otp, otp.expiresAt]
    );
    const insertResult = result as any;
    const [rows] = await this.pool.execute('SELECT * FROM otp_verifications WHERE id = ?', [insertResult.insertId]);
    const row = (rows as any[])[0];
    return {
      id: row.id,
      phoneNumber: row.phone_number,
      otp: row.otp,
      expiresAt: row.expires_at,
      verified: row.verified,
      createdAt: row.created_at
    };
  }

  async getOtpVerification(phoneNumber: string, otp: string): Promise<OtpVerification | undefined> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM otp_verifications WHERE phone_number = ? AND otp = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [phoneNumber, otp]
    );
    const otps = rows as any[];
    return otps[0] ? {
      id: otps[0].id,
      phoneNumber: otps[0].phone_number,
      otp: otps[0].otp,
      expiresAt: otps[0].expires_at,
      verified: otps[0].verified,
      createdAt: otps[0].created_at
    } : undefined;
  }

  async markOtpAsVerified(id: number): Promise<boolean> {
    const [result] = await this.pool.execute('UPDATE otp_verifications SET verified = TRUE WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async deleteExpiredOtps(): Promise<boolean> {
    const [result] = await this.pool.execute('DELETE FROM otp_verifications WHERE expires_at < NOW()');
    return (result as any).affectedRows >= 0;
  }
}