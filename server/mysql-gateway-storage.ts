import { IStorage } from './storage';
import { 
  User, InsertUser, UserActivity, InsertUserActivity, Interest, InsertInterest,
  CareerApplication, InsertCareerApplication, InvestorInquiry, InsertInvestorInquiry,
  FeedItem, InsertFeedItem, FeedLike, Session, InsertSession,
  OtpVerification, InsertOtpVerification
} from '@shared/schema';

interface GatewayResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class MySQLGatewayStorage implements IStorage {
  private gatewayUrl: string;
  private apiKey: string;

  constructor() {
    // You'll need to deploy the gateway and update these URLs
    this.gatewayUrl = process.env.MYSQL_GATEWAY_URL || 'https://your-gateway-server.com';
    this.apiKey = process.env.MYSQL_GATEWAY_API_KEY || 'stapubox-mysql-gateway-2025';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.gatewayUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const result: GatewayResponse<T> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result.data as T;
    } catch (error) {
      console.error(`MySQL Gateway request failed [${endpoint}]:`, error);
      throw error;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await this.request<User>(`/users/${id}`);
      return user || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    try {
      const result = await this.request<{ sql: string }>('/query', {
        method: 'POST',
        body: JSON.stringify({
          sql: `SELECT * FROM users WHERE phone_number = '${phoneNumber}' LIMIT 1`
        })
      });
      return result?.[0] || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const fields = Object.keys(user).map(key => 
      key === 'phoneNumber' ? 'phone_number' : 
      key === 'userType' ? 'user_type' : 
      key === 'dateOfBirth' ? 'date_of_birth' : 
      key === 'profilePhotoUrl' ? 'profile_photo_url' : 
      key === 'societyArea' ? 'society_area' : 
      key === 'locationCoordinates' ? 'location_coordinates' : 
      key === 'locationName' ? 'location_name' : 
      key === 'isActive' ? 'is_active' : 
      key === 'profileVisibility' ? 'profile_visibility' : key
    ).join(', ');
    
    const values = Object.values(user).map(v => 
      v === null ? 'NULL' : 
      typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : 
      typeof v === 'boolean' ? (v ? '1' : '0') : 
      String(v)
    ).join(', ');
    
    await this.request('/query', {
      method: 'POST',
      body: JSON.stringify({
        sql: `INSERT INTO users (${fields}) VALUES (${values})`
      })
    });
    
    // Return created user
    return this.getUserByPhoneNumber(user.phoneNumber!) as Promise<User>;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const updates = Object.entries(user).map(([key, value]) => {
      const dbKey = key === 'phoneNumber' ? 'phone_number' : 
                   key === 'userType' ? 'user_type' : 
                   key === 'dateOfBirth' ? 'date_of_birth' : 
                   key === 'profilePhotoUrl' ? 'profile_photo_url' : 
                   key === 'societyArea' ? 'society_area' : 
                   key === 'locationCoordinates' ? 'location_coordinates' : 
                   key === 'locationName' ? 'location_name' : 
                   key === 'isActive' ? 'is_active' : 
                   key === 'profileVisibility' ? 'profile_visibility' : key;
      
      const dbValue = value === null ? 'NULL' : 
                     typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : 
                     typeof value === 'boolean' ? (value ? '1' : '0') : 
                     String(value);
      
      return `${dbKey} = ${dbValue}`;
    }).join(', ');
    
    await this.request('/query', {
      method: 'POST',
      body: JSON.stringify({
        sql: `UPDATE users SET ${updates} WHERE id = ${id}`
      })
    });
    
    return this.getUser(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await this.request('/query', {
        method: 'POST',
        body: JSON.stringify({
          sql: `DELETE FROM users WHERE id = ${id}`
        })
      });
      return true;
    } catch (error) {
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
      return await this.request<User[]>('/users/search', {
        method: 'POST',
        body: JSON.stringify(filters)
      });
    } catch (error) {
      return [];
    }
  }

  // User activities
  async getUserActivities(userId: number): Promise<UserActivity[]> {
    try {
      return await this.request<UserActivity[]>(`/users/${userId}/activities`);
    } catch (error) {
      return [];
    }
  }

  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const fields = Object.keys(activity).map(key => 
      key === 'userId' ? 'user_id' : 
      key === 'activityName' ? 'activity_name' : 
      key === 'skillLevel' ? 'skill_level' : 
      key === 'isPrimary' ? 'is_primary' : 
      key === 'coachingExperienceYears' ? 'coaching_experience_years' : key
    ).join(', ');
    
    const values = Object.values(activity).map(v => 
      v === null ? 'NULL' : 
      typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : 
      typeof v === 'boolean' ? (v ? '1' : '0') : 
      String(v)
    ).join(', ');
    
    await this.request('/query', {
      method: 'POST',
      body: JSON.stringify({
        sql: `INSERT INTO user_activities (${fields}) VALUES (${values})`
      })
    });
    
    // Return created activity
    const activities = await this.getUserActivities(activity.userId);
    return activities.find(a => a.activityName === activity.activityName) as UserActivity;
  }

  async updateUserActivity(id: number, activity: Partial<InsertUserActivity>): Promise<UserActivity | undefined> {
    const updates = Object.entries(activity).map(([key, value]) => {
      const dbKey = key === 'userId' ? 'user_id' : 
                   key === 'activityName' ? 'activity_name' : 
                   key === 'skillLevel' ? 'skill_level' : 
                   key === 'isPrimary' ? 'is_primary' : 
                   key === 'coachingExperienceYears' ? 'coaching_experience_years' : key;
      
      const dbValue = value === null ? 'NULL' : 
                     typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : 
                     typeof value === 'boolean' ? (value ? '1' : '0') : 
                     String(value);
      
      return `${dbKey} = ${dbValue}`;
    }).join(', ');
    
    await this.request('/query', {
      method: 'POST',
      body: JSON.stringify({
        sql: `UPDATE user_activities SET ${updates} WHERE id = ${id}`
      })
    });
    
    const result = await this.request<UserActivity[]>('/query', {
      method: 'POST',
      body: JSON.stringify({
        sql: `SELECT * FROM user_activities WHERE id = ${id}`
      })
    });
    
    return result[0] || undefined;
  }

  async deleteUserActivities(userId: number): Promise<boolean> {
    try {
      await this.request('/query', {
        method: 'POST',
        body: JSON.stringify({
          sql: `DELETE FROM user_activities WHERE user_id = ${userId}`
        })
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Interests
  async getInterest(id: number): Promise<Interest | undefined> {
    try {
      const result = await this.request<Interest[]>('/query', {
        method: 'POST',
        body: JSON.stringify({
          sql: `SELECT * FROM interests WHERE id = ${id}`
        })
      });
      return result[0] || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getInterestsBySender(senderId: number): Promise<Interest[]> {
    try {
      return await this.request<Interest[]>(`/interests/sent/${senderId}`);
    } catch (error) {
      return [];
    }
  }

  async getInterestsByReceiver(receiverId: number): Promise<Interest[]> {
    try {
      return await this.request<Interest[]>(`/interests/received/${receiverId}`);
    } catch (error) {
      return [];
    }
  }

  async getInterestByUsers(senderId: number, receiverId: number): Promise<Interest | undefined> {
    try {
      const result = await this.request<Interest[]>('/query', {
        method: 'POST',
        body: JSON.stringify({
          sql: `SELECT * FROM interests WHERE sender_id = ${senderId} AND receiver_id = ${receiverId}`
        })
      });
      return result[0] || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async createInterest(interest: InsertInterest): Promise<Interest> {
    const fields = Object.keys(interest).map(key => 
      key === 'senderId' ? 'sender_id' : 
      key === 'receiverId' ? 'receiver_id' : 
      key === 'sentAt' ? 'sent_at' : 
      key === 'respondedAt' ? 'responded_at' : key
    ).join(', ');
    
    const values = Object.values(interest).map(v => 
      v === null ? 'NULL' : 
      typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : 
      String(v)
    ).join(', ');
    
    await this.request('/query', {
      method: 'POST',
      body: JSON.stringify({
        sql: `INSERT INTO interests (${fields}) VALUES (${values})`
      })
    });
    
    return this.getInterestByUsers(interest.senderId, interest.receiverId) as Promise<Interest>;
  }

  async updateInterest(id: number, interest: Partial<Interest>): Promise<Interest | undefined> {
    const updates = Object.entries(interest).map(([key, value]) => {
      const dbKey = key === 'senderId' ? 'sender_id' : 
                   key === 'receiverId' ? 'receiver_id' : 
                   key === 'sentAt' ? 'sent_at' : 
                   key === 'respondedAt' ? 'responded_at' : key;
      
      const dbValue = value === null ? 'NULL' : 
                     typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : 
                     String(value);
      
      return `${dbKey} = ${dbValue}`;
    }).join(', ');
    
    await this.request('/query', {
      method: 'POST',
      body: JSON.stringify({
        sql: `UPDATE interests SET ${updates} WHERE id = ${id}`
      })
    });
    
    return this.getInterest(id);
  }

  async countTodayInterestsBySender(senderId: number): Promise<number> {
    try {
      const result = await this.request<any[]>('/query', {
        method: 'POST',
        body: JSON.stringify({
          sql: `SELECT COUNT(*) as count FROM interests WHERE sender_id = ${senderId} AND DATE(sent_at) = CURDATE()`
        })
      });
      return result[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  // Filter options
  async getFilterOptions(userType?: string): Promise<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }> {
    try {
      return await this.request('/filter-options');
    } catch (error) {
      return {
        cities: [],
        societyAreas: [],
        activities: [],
        skillLevels: [],
        workplaces: []
      };
    }
  }

  // Placeholder implementations for other methods
  // These would need similar implementations following the pattern above

  async createCareerApplication(application: InsertCareerApplication): Promise<CareerApplication> {
    throw new Error('Career applications not yet implemented in gateway');
  }

  async getCareerApplications(): Promise<CareerApplication[]> {
    return [];
  }

  async createInvestorInquiry(inquiry: InsertInvestorInquiry): Promise<InvestorInquiry> {
    throw new Error('Investor inquiries not yet implemented in gateway');
  }

  async getInvestorInquiries(): Promise<InvestorInquiry[]> {
    return [];
  }

  async getFeedItems(limit = 20, offset = 0): Promise<FeedItem[]> {
    return [];
  }

  async createFeedItem(item: InsertFeedItem): Promise<FeedItem> {
    throw new Error('Feed items not yet implemented in gateway');
  }

  async getFeedLike(userId: number, feedItemId: number): Promise<FeedLike | undefined> {
    return undefined;
  }

  async createFeedLike(userId: number, feedItemId: number): Promise<FeedLike> {
    throw new Error('Feed likes not yet implemented in gateway');
  }

  async deleteFeedLike(userId: number, feedItemId: number): Promise<boolean> {
    return false;
  }

  async updateFeedItemLikes(feedItemId: number, increment: number): Promise<boolean> {
    return false;
  }

  async createSession(session: InsertSession): Promise<Session> {
    throw new Error('Sessions not yet implemented in gateway');
  }

  async getSession(sessionToken: string): Promise<Session | undefined> {
    return undefined;
  }

  async getSessionByPhoneNumber(phoneNumber: string): Promise<Session | undefined> {
    return undefined;
  }

  async updateSession(sessionToken: string, updates: Partial<Session>): Promise<Session | undefined> {
    return undefined;
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    return false;
  }

  async deleteExpiredSessions(): Promise<boolean> {
    return false;
  }

  async createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification> {
    throw new Error('OTP verification not yet implemented in gateway');
  }

  async getOtpVerification(phoneNumber: string, otp: string): Promise<OtpVerification | undefined> {
    return undefined;
  }

  async markOtpAsVerified(id: number): Promise<boolean> {
    return false;
  }

  async deleteExpiredOtps(): Promise<boolean> {
    return false;
  }
}