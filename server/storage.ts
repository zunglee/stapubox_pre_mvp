import fs from 'fs';
import { 
  users, userActivities, interests, careerApplications, investorInquiries, 
  feedItems, feedLikes, sessions, otpVerifications, buzzDigest, buzzInteractions,
  type User, type InsertUser, type UserActivity, type InsertUserActivity,
  type Interest, type InsertInterest, type CareerApplication, type InsertCareerApplication,
  type InvestorInquiry, type InsertInvestorInquiry, type FeedItem, type InsertFeedItem,
  type FeedLike, type Session, type InsertSession, type OtpVerification, type InsertOtpVerification,
  type BuzzDigest, type InsertBuzzDigest, type BuzzInteraction, type InsertBuzzInteraction
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateProfilePicture(id: number, profilePhotoUrl: string): Promise<User | undefined>;
  updateUserDominantColor(id: number, dominantColor: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  searchUsers(filters: {
    userType?: string;
    cities?: string[];
    societyAreas?: string[];
    activities?: string[];
    skillLevels?: string[];
    workplaces?: string[];
    // Legacy single-value filters for backward compatibility
    city?: string;
    societyArea?: string;
    activityName?: string;
    skillLevel?: string;
    workplace?: string;
    minAge?: number;
    maxAge?: number;
    excludeUserId?: number;
  }): Promise<User[]>;

  // User Activities
  getUserActivities(userId: number): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  updateUserActivity(id: number, activity: Partial<InsertUserActivity>): Promise<UserActivity | undefined>;
  deleteUserActivities(userId: number): Promise<boolean>;

  // Interests
  getInterest(id: number): Promise<Interest | undefined>;
  getInterestsBySender(senderId: number): Promise<Interest[]>;
  getInterestsByReceiver(receiverId: number): Promise<Interest[]>;
  getInterestByUsers(senderId: number, receiverId: number): Promise<Interest | undefined>;
  createInterest(interest: InsertInterest): Promise<Interest>;
  updateInterest(id: number, interest: Partial<Interest>): Promise<Interest | undefined>;
  countTodayInterestsBySender(senderId: number): Promise<number>;

  // Career Applications
  createCareerApplication(application: InsertCareerApplication): Promise<CareerApplication>;
  getCareerApplications(): Promise<CareerApplication[]>;

  // Investor Inquiries
  createInvestorInquiry(inquiry: InsertInvestorInquiry): Promise<InvestorInquiry>;
  getInvestorInquiries(): Promise<InvestorInquiry[]>;

  // Feed
  getFeedItems(limit?: number, offset?: number): Promise<FeedItem[]>;
  createFeedItem(item: InsertFeedItem): Promise<FeedItem>;
  getFeedLike(userId: number, feedItemId: number): Promise<FeedLike | undefined>;
  createFeedLike(userId: number, feedItemId: number): Promise<FeedLike>;
  deleteFeedLike(userId: number, feedItemId: number): Promise<boolean>;
  updateFeedItemLikes(feedItemId: number, increment: number): Promise<boolean>;

  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSession(sessionToken: string): Promise<Session | undefined>;
  getSessionByPhoneNumber(phoneNumber: string): Promise<Session | undefined>;
  updateSession(sessionToken: string, updates: Partial<Session>): Promise<Session | undefined>;
  deleteSession(sessionToken: string): Promise<boolean>;
  deleteExpiredSessions(): Promise<boolean>;

  // Filter Options
  getFilterOptions(userType?: string): Promise<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }>;
  getFilterOptionsFromUsers(users: User[], userType?: string): Promise<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }>;

  // OTP Verifications
  createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerification(phoneNumber: string, otp: string): Promise<OtpVerification | undefined>;
  markOtpAsVerified(id: number): Promise<boolean>;
  deleteExpiredOtps(): Promise<boolean>;

  // Buzz Digest (News)
  createBuzzDigest(digest: InsertBuzzDigest): Promise<BuzzDigest>;
  getBuzzDigests(limit?: number, offset?: number, userId?: number, excludeBuzzIds?: number[], sportsFilter?: number[]): Promise<BuzzDigest[]>;
  getBuzzDigestById(id: number): Promise<BuzzDigest | undefined>;
  getBuzzDigestByBuzzId(buzzId: number): Promise<BuzzDigest | undefined>;
  getBuzzDigestBySrcLink(srcLink: string): Promise<BuzzDigest | undefined>;
  updateBuzzDigestCounts(buzzId: number, counts: { likeCnt?: number; dislikeCnt?: number; shareCnt?: number; viewCnt?: number }): Promise<BuzzDigest | undefined>;

  // Buzz Interactions
  createBuzzInteraction(interaction: InsertBuzzInteraction): Promise<BuzzInteraction>;
  getBuzzInteraction(buzzId: number, userId: number): Promise<BuzzInteraction | undefined>;
  updateBuzzInteraction(id: number, interaction: Partial<BuzzInteraction>): Promise<BuzzInteraction | undefined>;
  getBuzzInteractionsByUser(userId: number): Promise<BuzzInteraction[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private userActivities: Map<number, UserActivity> = new Map();
  private interests: Map<number, Interest> = new Map();
  private careerApplications: Map<number, CareerApplication> = new Map();
  private investorInquiries: Map<number, InvestorInquiry> = new Map();
  private feedItems: Map<number, FeedItem> = new Map();
  private feedLikes: Map<number, FeedLike> = new Map();
  private sessions: Map<number, Session> = new Map();
  private otpVerifications: Map<number, OtpVerification> = new Map();
  
  private currentUserId = 1;
  private currentUserActivityId = 1;
  private currentInterestId = 1;
  private currentCareerApplicationId = 1;
  private currentInvestorInquiryId = 1;
  private currentFeedItemId = 1;
  private currentFeedLikeId = 1;
  private currentSessionId = 1;
  private currentOtpId = 1;

  private dataFilePath = './storage-data.json';

  constructor() {
    this.loadFromDisk();
    this.initializeSampleData();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.dataFilePath, 'utf8'));
        
        // Restore data from disk
        this.users = new Map(data.users || []);
        this.userActivities = new Map(data.userActivities || []);
        this.interests = new Map(data.interests || []);
        this.careerApplications = new Map(data.careerApplications || []);
        this.investorInquiries = new Map(data.investorInquiries || []);
        this.feedItems = new Map(data.feedItems || []);
        this.feedLikes = new Map(data.feedLikes || []);
        this.sessions = new Map(data.sessions || []);
        this.otpVerifications = new Map(data.otpVerifications || []);
        
        // Restore counters
        this.currentUserId = data.currentUserId || 1;
        this.currentUserActivityId = data.currentUserActivityId || 1;
        this.currentInterestId = data.currentInterestId || 1;
        this.currentCareerApplicationId = data.currentCareerApplicationId || 1;
        this.currentInvestorInquiryId = data.currentInvestorInquiryId || 1;
        this.currentFeedItemId = data.currentFeedItemId || 1;
        this.currentFeedLikeId = data.currentFeedLikeId || 1;
        this.currentSessionId = data.currentSessionId || 1;
        this.currentOtpId = data.currentOtpId || 1;
        
        console.log(`Loaded ${this.users.size} users from persistent storage`);
      }
    } catch (error) {
      console.log('No persistent storage found, starting fresh');
    }
  }

  private saveToDisk() {
    // Use synchronous file operations to persist data permanently
    const data = {
      users: Array.from(this.users.entries()),
      userActivities: Array.from(this.userActivities.entries()),
      interests: Array.from(this.interests.entries()),
      careerApplications: Array.from(this.careerApplications.entries()),
      investorInquiries: Array.from(this.investorInquiries.entries()),
      feedItems: Array.from(this.feedItems.entries()),
      feedLikes: Array.from(this.feedLikes.entries()),
      sessions: Array.from(this.sessions.entries()),
      otpVerifications: Array.from(this.otpVerifications.entries()),
      currentUserId: this.currentUserId,
      currentUserActivityId: this.currentUserActivityId,
      currentInterestId: this.currentInterestId,
      currentCareerApplicationId: this.currentCareerApplicationId,
      currentInvestorInquiryId: this.currentInvestorInquiryId,
      currentFeedItemId: this.currentFeedItemId,
      currentFeedLikeId: this.currentFeedLikeId,
      currentSessionId: this.currentSessionId,
      currentOtpId: this.currentOtpId
    };
    
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2));
      console.log('User data persisted to disk successfully');
    } catch (error) {
      console.error('Failed to persist user data:', error);
      // Continue anyway - data is still in memory
    }
  }

  private initializeSampleData() {
    // Never modify existing user data - only log current state
    if (this.users.size === 0) {
      console.log('No users found - platform ready for first registrations');
      // Don't save to disk during initialization to avoid overwriting existing data
    } else {
      console.log(`User data preserved - ${this.users.size} users in system`);
      Array.from(this.users.values()).forEach(user => {
        console.log(`- ${user.name} (${user.phoneNumber})`);
      });
    }
  }



  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phoneNumber === phoneNumber);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email ?? null,
      bio: insertUser.bio ?? null,
      profilePhotoUrl: insertUser.profilePhotoUrl ?? null,

      societyArea: insertUser.societyArea ?? null,
      profileVisibility: insertUser.profileVisibility ?? "public",
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    this.saveToDisk(); // Persist to disk
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...updateData,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    this.saveToDisk(); // Persist changes to disk
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
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
    let users = Array.from(this.users.values()).filter(user => user.isActive);
    
    if (filters.excludeUserId) {
      users = users.filter(user => user.id !== filters.excludeUserId);
    }
    
    if (filters.userType) {
      users = users.filter(user => user.userType === filters.userType);
    }
    
    if (filters.city) {
      users = users.filter(user => user.city.toLowerCase().includes(filters.city!.toLowerCase()));
    }
    
    if (filters.societyArea) {
      users = users.filter(user => user.societyArea && user.societyArea.toLowerCase().includes(filters.societyArea!.toLowerCase()));
    }
    
    if (filters.workplace) {
      users = users.filter(user => user.workplace.toLowerCase().includes(filters.workplace!.toLowerCase()));
    }
    
    if (filters.minAge) {
      users = users.filter(user => user.age >= filters.minAge!);
    }
    
    if (filters.maxAge) {
      users = users.filter(user => user.age <= filters.maxAge!);
    }
    
    if (filters.activityName || filters.skillLevel) {
      const userIds = Array.from(this.userActivities.values())
        .filter(activity => {
          if (filters.activityName && !activity.activityName.toLowerCase().includes(filters.activityName.toLowerCase())) {
            return false;
          }
          if (filters.skillLevel && activity.skillLevel !== filters.skillLevel) {
            return false;
          }
          return true;
        })
        .map(activity => activity.userId);
      
      users = users.filter(user => userIds.includes(user.id));
    }
    
    return users;
  }

  // User Activities
  async getUserActivities(userId: number): Promise<UserActivity[]> {
    return Array.from(this.userActivities.values()).filter(activity => activity.userId === userId);
  }

  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const id = this.currentUserActivityId++;
    const activity: UserActivity = { 
      ...insertActivity, 
      id,
      isPrimary: insertActivity.isPrimary ?? false,
      coachingExperienceYears: insertActivity.coachingExperienceYears ?? null,
      certifications: insertActivity.certifications ?? null
    };
    this.userActivities.set(id, activity);
    this.saveToDisk();
    return activity;
  }

  async updateUserActivity(id: number, updateData: Partial<InsertUserActivity>): Promise<UserActivity | undefined> {
    const activity = this.userActivities.get(id);
    if (!activity) return undefined;
    
    const updatedActivity: UserActivity = { ...activity, ...updateData };
    this.userActivities.set(id, updatedActivity);
    return updatedActivity;
  }

  async deleteUserActivities(userId: number): Promise<boolean> {
    const activities = Array.from(this.userActivities.entries()).filter(([_, activity]) => activity.userId === userId);
    activities.forEach(([id]) => this.userActivities.delete(id));
    return true;
  }

  // Interests
  async getInterest(id: number): Promise<Interest | undefined> {
    return this.interests.get(id);
  }

  async getInterestsBySender(senderId: number): Promise<Interest[]> {
    return Array.from(this.interests.values()).filter(interest => interest.senderId === senderId);
  }

  async getInterestsByReceiver(receiverId: number): Promise<Interest[]> {
    return Array.from(this.interests.values()).filter(interest => interest.receiverId === receiverId);
  }

  async getInterestByUsers(senderId: number, receiverId: number): Promise<Interest | undefined> {
    return Array.from(this.interests.values()).find(
      interest => interest.senderId === senderId && interest.receiverId === receiverId
    );
  }

  async createInterest(insertInterest: InsertInterest): Promise<Interest> {
    const id = this.currentInterestId++;
    const interest: Interest = { 
      ...insertInterest, 
      id,
      status: insertInterest.status ?? "pending",
      sentAt: new Date(),
      respondedAt: null
    };
    this.interests.set(id, interest);
    return interest;
  }

  async updateInterest(id: number, updateData: Partial<Interest>): Promise<Interest | undefined> {
    const interest = this.interests.get(id);
    if (!interest) return undefined;
    
    const updatedInterest: Interest = {
      ...interest,
      ...updateData,
      respondedAt: updateData.status && updateData.status !== 'pending' ? new Date() : interest.respondedAt
    };
    this.interests.set(id, updatedInterest);
    return updatedInterest;
  }

  async countTodayInterestsBySender(senderId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.interests.values()).filter(
      interest => interest.senderId === senderId && interest.sentAt >= today
    ).length;
  }

  // Career Applications
  async createCareerApplication(insertApplication: InsertCareerApplication): Promise<CareerApplication> {
    const id = this.currentCareerApplicationId++;
    const application: CareerApplication = { 
      name: insertApplication.name,
      email: insertApplication.email,
      phone: insertApplication.phone,
      resumeUrl: insertApplication.resumeUrl || null,
      contributionArea: insertApplication.contributionArea,
      id, 
      submittedAt: new Date()
    };
    this.careerApplications.set(id, application);
    return application;
  }

  async getCareerApplications(): Promise<CareerApplication[]> {
    return Array.from(this.careerApplications.values());
  }

  // Investor Inquiries
  async createInvestorInquiry(insertInquiry: InsertInvestorInquiry): Promise<InvestorInquiry> {
    const id = this.currentInvestorInquiryId++;
    const inquiry: InvestorInquiry = { 
      ...insertInquiry, 
      id, 
      submittedAt: new Date()
    };
    this.investorInquiries.set(id, inquiry);
    return inquiry;
  }

  async getInvestorInquiries(): Promise<InvestorInquiry[]> {
    return Array.from(this.investorInquiries.values());
  }

  // Feed
  async getFeedItems(limit = 20, offset = 0): Promise<FeedItem[]> {
    const items = Array.from(this.feedItems.values())
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(offset, offset + limit);
    return items;
  }

  async createFeedItem(insertItem: InsertFeedItem): Promise<FeedItem> {
    const id = this.currentFeedItemId++;
    const item: FeedItem = { 
      ...insertItem, 
      id,
      imageUrl: insertItem.imageUrl ?? null,
      likeCount: insertItem.likeCount ?? 0,
      publishedAt: new Date()
    };
    this.feedItems.set(id, item);
    return item;
  }

  async getFeedLike(userId: number, feedItemId: number): Promise<FeedLike | undefined> {
    return Array.from(this.feedLikes.values()).find(
      like => like.userId === userId && like.feedItemId === feedItemId
    );
  }

  async createFeedLike(userId: number, feedItemId: number): Promise<FeedLike> {
    const id = this.currentFeedLikeId++;
    const like: FeedLike = { 
      id, 
      userId, 
      feedItemId, 
      createdAt: new Date()
    };
    this.feedLikes.set(id, like);
    return like;
  }

  async deleteFeedLike(userId: number, feedItemId: number): Promise<boolean> {
    const like = Array.from(this.feedLikes.entries()).find(
      ([_, like]) => like.userId === userId && like.feedItemId === feedItemId
    );
    if (like) {
      this.feedLikes.delete(like[0]);
      return true;
    }
    return false;
  }

  async updateFeedItemLikes(feedItemId: number, increment: number): Promise<boolean> {
    const item = this.feedItems.get(feedItemId);
    if (!item) return false;
    
    const updatedItem: FeedItem = {
      ...item,
      likeCount: Math.max(0, item.likeCount + increment)
    };
    this.feedItems.set(feedItemId, updatedItem);
    return true;
  }

  // Sessions
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = { 
      ...insertSession, 
      id,
      userId: insertSession.userId ?? null,
      sessionType: insertSession.sessionType ?? "otp_verified",
      createdAt: new Date()
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(sessionToken: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(session => session.sessionToken === sessionToken);
  }

  async getSessionByPhoneNumber(phoneNumber: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(session => session.phoneNumber === phoneNumber);
  }

  async updateSession(sessionToken: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = await this.getSession(sessionToken);
    if (!session) return undefined;
    
    const updatedSession: Session = { ...session, ...updates };
    this.sessions.set(session.id, updatedSession);
    return updatedSession;
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    const session = Array.from(this.sessions.entries()).find(
      ([_, session]) => session.sessionToken === sessionToken
    );
    if (session) {
      this.sessions.delete(session[0]);
      return true;
    }
    return false;
  }

  async deleteExpiredSessions(): Promise<boolean> {
    const now = new Date();
    const expiredSessions = Array.from(this.sessions.entries()).filter(
      ([_, session]) => session.expiresAt < now
    );
    expiredSessions.forEach(([id]) => this.sessions.delete(id));
    return true;
  }

  // OTP Verifications
  async createOtpVerification(insertOtp: InsertOtpVerification): Promise<OtpVerification> {
    const id = this.currentOtpId++;
    const otp: OtpVerification = { 
      ...insertOtp, 
      id,
      verified: insertOtp.verified ?? false,
      createdAt: new Date(),
      expiresAt: insertOtp.expiresAt
    };
    this.otpVerifications.set(id, otp);
    return otp;
  }

  async getOtpVerification(phoneNumber: string, otp: string): Promise<OtpVerification | undefined> {
    return Array.from(this.otpVerifications.values()).find(
      verification => verification.phoneNumber === phoneNumber && 
                     verification.otp === otp && 
                     !verification.verified &&
                     verification.expiresAt > new Date()
    );
  }

  async markOtpAsVerified(id: number): Promise<boolean> {
    const otp = this.otpVerifications.get(id);
    if (!otp) return false;
    
    const updatedOtp: OtpVerification = { ...otp, verified: true };
    this.otpVerifications.set(id, updatedOtp);
    return true;
  }

  async deleteExpiredOtps(): Promise<boolean> {
    const now = new Date();
    const expiredOtps = Array.from(this.otpVerifications.entries()).filter(
      ([_, otp]) => otp.expiresAt < now
    );
    expiredOtps.forEach(([id]) => this.otpVerifications.delete(id));
    return true;
  }

  async getFilterOptions(userType?: string): Promise<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }> {
    // Filter users by type if specified
    let users = Array.from(this.users.values()).filter(user => user.isActive);
    if (userType) {
      users = users.filter(user => user.userType === userType);
    }
    
    // Get activities only for filtered users
    const userIds = users.map(user => user.id);
    const activities = Array.from(this.userActivities.values()).filter(activity => 
      userIds.includes(activity.userId)
    );

    // Extract unique values from existing data
    const citySet = new Set<string>();
    users.forEach(user => { if (user.city) citySet.add(user.city); });
    const cities = Array.from(citySet).sort();

    const societyAreaSet = new Set<string>();
    users.forEach(user => { if (user.societyArea) societyAreaSet.add(user.societyArea); });
    const societyAreas = Array.from(societyAreaSet).sort();

    const activitySet = new Set<string>();
    activities.forEach(activity => { if (activity.activityName) activitySet.add(activity.activityName); });
    const activityNames = Array.from(activitySet).sort();

    const skillLevelSet = new Set<string>();
    activities.forEach(activity => { if (activity.skillLevel) skillLevelSet.add(activity.skillLevel); });
    const skillLevels = Array.from(skillLevelSet).sort();

    const workplaceSet = new Set<string>();
    users.forEach(user => { if (user.workplace) workplaceSet.add(user.workplace); });
    const workplaces = Array.from(workplaceSet).sort();

    return {
      cities,
      societyAreas,
      activities: activityNames,
      skillLevels,
      workplaces
    };
  }
}

// Import database storage
import { db } from './db.js';
import { eq, and, desc, gte, lt, sql, isNull, inArray } from 'drizzle-orm';

// Database storage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateProfilePicture(id: number, profilePhotoUrl: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ profilePhotoUrl, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserDominantColor(id: number, dominantColor: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ dominantColor, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async searchUsers(filters: {
    userType?: string;
    cities?: string[];
    societyAreas?: string[];
    activities?: string[];
    skillLevels?: string[];
    workplaces?: string[];
    // Legacy single-value filters for backward compatibility
    city?: string;
    societyArea?: string;
    activityName?: string;
    skillLevel?: string;
    workplace?: string;
    minAge?: number;
    maxAge?: number;
    excludeUserId?: number;
  }): Promise<User[]> {
    try {
      console.log(`🔍 DATABASE SEARCH START: Starting search with filters:`, JSON.stringify(filters));
      
      // Get all active users with their activities
      const usersWithActivities = await db.select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      name: users.name,
      email: users.email,
      userType: users.userType,
      dateOfBirth: users.dateOfBirth,
      age: users.age,
      workplace: users.workplace,
      bio: users.bio,
      profilePhotoUrl: users.profilePhotoUrl,
      dominantColor: users.dominantColor,
      locationCoordinates: users.locationCoordinates,
      locationName: users.locationName,
      city: users.city,
      societyArea: users.societyArea,
      profileVisibility: users.profileVisibility,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      activities: sql<any[]>`
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', ua.id,
                'userId', ua.user_id,
                'activityName', ua.activity_name,
                'skillLevel', ua.skill_level,
                'isPrimary', ua.is_primary,
                'coachingExperienceYears', ua.coaching_experience_years,
                'certifications', ua.certifications
              )
            )
            FROM user_activities ua
            WHERE ua.user_id = users.id
          ),
          '[]'::json
        )
      `
    })
    .from(users)
    .where(eq(users.isActive, true));

    console.log(`🔍 DATABASE SEARCH: Found ${usersWithActivities.length} users in database before filtering`);

    // Apply filters
    let filteredUsers = usersWithActivities;

    if (filters.userType) {
      filteredUsers = filteredUsers.filter(user => user.userType === filters.userType);
    }

    // Multi-select filters with OR logic
    if (filters.cities && filters.cities.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        filters.cities!.some(city => user.city === city)
      );
    } else if (filters.city) {
      // Legacy single value filter for backward compatibility
      filteredUsers = filteredUsers.filter(user => user.city === filters.city);
    }

    if (filters.societyAreas && filters.societyAreas.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        filters.societyAreas!.some(area => user.societyArea === area)
      );
    } else if (filters.societyArea) {
      // Legacy single value filter for backward compatibility
      filteredUsers = filteredUsers.filter(user => user.societyArea === filters.societyArea);
    }

    if (filters.workplaces && filters.workplaces.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        filters.workplaces!.some(workplace => 
          user.workplace?.toLowerCase().includes(workplace.toLowerCase())
        )
      );
    } else if (filters.workplace) {
      // Legacy single value filter for backward compatibility
      filteredUsers = filteredUsers.filter(user => user.workplace?.toLowerCase().includes(filters.workplace!.toLowerCase()));
    }

    if (filters.minAge) {
      filteredUsers = filteredUsers.filter(user => user.age >= filters.minAge!);
    }

    if (filters.maxAge) {
      filteredUsers = filteredUsers.filter(user => user.age <= filters.maxAge!);
    }

    if (filters.excludeUserId) {
      filteredUsers = filteredUsers.filter(user => user.id !== filters.excludeUserId);
    }

    // Multi-select activity filtering with OR logic
    if (filters.activities && filters.activities.length > 0) {
      filteredUsers = filteredUsers.filter(user => {
        return user.activities.some((activity: any) => 
          filters.activities!.includes(activity.activityName)
        );
      });
    } else if (filters.activityName) {
      // Legacy single value filter for backward compatibility
      filteredUsers = filteredUsers.filter(user => {
        return user.activities.some((activity: any) => 
          activity.activityName === filters.activityName
        );
      });
    }

    // Multi-select skill level filtering with OR logic
    if (filters.skillLevels && filters.skillLevels.length > 0) {
      filteredUsers = filteredUsers.filter(user => {
        return user.activities.some((activity: any) => 
          filters.skillLevels!.includes(activity.skillLevel)
        );
      });
    } else if (filters.skillLevel) {
      // Legacy single value filter for backward compatibility
      filteredUsers = filteredUsers.filter(user => {
        return user.activities.some((activity: any) => 
          activity.skillLevel === filters.skillLevel
        );
      });
    }

    console.log(`🔍 DATABASE SEARCH FINAL: Returning ${filteredUsers.length} users after all filtering`);
    return filteredUsers;
    } catch (error) {
      console.error('🚨 DATABASE SEARCH ERROR:', error);
      return [];
    }
  }

  async getUserActivities(userId: number): Promise<UserActivity[]> {
    return await db.select().from(userActivities).where(eq(userActivities.userId, userId));
  }

  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const [activity] = await db.insert(userActivities).values(insertActivity).returning();
    return activity;
  }

  async updateUserActivity(id: number, updateData: Partial<InsertUserActivity>): Promise<UserActivity | undefined> {
    const [activity] = await db.update(userActivities)
      .set(updateData)
      .where(eq(userActivities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteUserActivities(userId: number): Promise<boolean> {
    const result = await db.delete(userActivities).where(eq(userActivities.userId, userId));
    return result.rowCount > 0;
  }

  async getInterest(id: number): Promise<Interest | undefined> {
    const [interest] = await db.select().from(interests).where(eq(interests.id, id));
    return interest || undefined;
  }

  async getInterestsBySender(senderId: number): Promise<Interest[]> {
    return await db.select().from(interests)
      .where(eq(interests.senderId, senderId))
      .orderBy(desc(interests.sentAt));
  }

  async getInterestsByReceiver(receiverId: number): Promise<Interest[]> {
    return await db.select().from(interests)
      .where(eq(interests.receiverId, receiverId))
      .orderBy(desc(interests.sentAt));
  }

  async getInterestByUsers(senderId: number, receiverId: number): Promise<Interest | undefined> {
    const [interest] = await db.select().from(interests)
      .where(and(eq(interests.senderId, senderId), eq(interests.receiverId, receiverId)));
    return interest || undefined;
  }

  async createInterest(insertInterest: InsertInterest): Promise<Interest> {
    const [interest] = await db.insert(interests).values(insertInterest).returning();
    return interest;
  }

  async updateInterest(id: number, updateData: Partial<Interest>): Promise<Interest | undefined> {
    const [interest] = await db.update(interests)
      .set(updateData)
      .where(eq(interests.id, id))
      .returning();
    return interest || undefined;
  }

  async countTodayInterestsBySender(senderId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db.select({ count: sql<number>`count(*)` })
      .from(interests)
      .where(and(
        eq(interests.senderId, senderId),
        gte(interests.sentAt, today),
        lt(interests.sentAt, tomorrow)
      ));
    return result[0]?.count || 0;
  }

  async createCareerApplication(insertApplication: InsertCareerApplication): Promise<CareerApplication> {
    const [application] = await db.insert(careerApplications).values(insertApplication).returning();
    return application;
  }

  async getCareerApplications(): Promise<CareerApplication[]> {
    return await db.select().from(careerApplications).orderBy(desc(careerApplications.submittedAt));
  }

  async createInvestorInquiry(insertInquiry: InsertInvestorInquiry): Promise<InvestorInquiry> {
    const [inquiry] = await db.insert(investorInquiries).values(insertInquiry).returning();
    return inquiry;
  }

  async getInvestorInquiries(): Promise<InvestorInquiry[]> {
    return await db.select().from(investorInquiries).orderBy(desc(investorInquiries.submittedAt));
  }

  async getFeedItems(limit = 20, offset = 0): Promise<FeedItem[]> {
    return await db.select().from(feedItems)
      .orderBy(desc(feedItems.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  async createFeedItem(insertItem: InsertFeedItem): Promise<FeedItem> {
    const [item] = await db.insert(feedItems).values(insertItem).returning();
    return item;
  }

  async getFeedLike(userId: number, feedItemId: number): Promise<FeedLike | undefined> {
    const [like] = await db.select().from(feedLikes)
      .where(and(eq(feedLikes.userId, userId), eq(feedLikes.feedItemId, feedItemId)));
    return like || undefined;
  }

  async createFeedLike(userId: number, feedItemId: number): Promise<FeedLike> {
    const [like] = await db.insert(feedLikes).values({ userId, feedItemId }).returning();
    return like;
  }

  async deleteFeedLike(userId: number, feedItemId: number): Promise<boolean> {
    const result = await db.delete(feedLikes)
      .where(and(eq(feedLikes.userId, userId), eq(feedLikes.feedItemId, feedItemId)));
    return result.rowCount > 0;
  }

  async updateFeedItemLikes(feedItemId: number, increment: number): Promise<boolean> {
    const result = await db.update(feedItems)
      .set({ likeCount: sql`${feedItems.likeCount} + ${increment}` })
      .where(eq(feedItems.id, feedItemId));
    return result.rowCount > 0;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async getSession(sessionToken: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionToken, sessionToken));
    return session || undefined;
  }

  async getSessionByPhoneNumber(phoneNumber: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions)
      .where(eq(sessions.phoneNumber, phoneNumber))
      .orderBy(desc(sessions.createdAt));
    return session || undefined;
  }

  async updateSession(sessionToken: string, updates: Partial<Session>): Promise<Session | undefined> {
    const [session] = await db.update(sessions)
      .set(updates)
      .where(eq(sessions.sessionToken, sessionToken))
      .returning();
    return session || undefined;
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    return result.rowCount > 0;
  }

  async deleteExpiredSessions(): Promise<boolean> {
    const now = new Date();
    const result = await db.delete(sessions).where(lt(sessions.expiresAt, now));
    return result.rowCount > 0;
  }

  async createOtpVerification(insertOtp: InsertOtpVerification): Promise<OtpVerification> {
    const [otp] = await db.insert(otpVerifications).values(insertOtp).returning();
    return otp;
  }

  async getOtpVerification(phoneNumber: string, otp: string): Promise<OtpVerification | undefined> {
    const [verification] = await db.select().from(otpVerifications)
      .where(and(
        eq(otpVerifications.phoneNumber, phoneNumber),
        eq(otpVerifications.otp, otp),
        eq(otpVerifications.verified, false),
        gte(otpVerifications.expiresAt, new Date())
      ));
    return verification || undefined;
  }

  async markOtpAsVerified(id: number): Promise<boolean> {
    const result = await db.update(otpVerifications)
      .set({ verified: true })
      .where(eq(otpVerifications.id, id));
    return result.rowCount > 0;
  }

  async deleteExpiredOtps(): Promise<boolean> {
    const now = new Date();
    const result = await db.delete(otpVerifications).where(lt(otpVerifications.expiresAt, now));
    return result.rowCount > 0;
  }

  async getFilterOptions(userType?: string): Promise<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }> {
    // Build conditions based on user type
    if (userType && userType !== 'all') {
      // Filter by specific user type
      const userTypeFilter = eq(users.userType, userType as 'player' | 'coach');

      // Get unique cities filtered by user type
      const cityResult = await db.selectDistinct({ city: users.city })
        .from(users)
        .where(and(userTypeFilter, sql`${users.city} IS NOT NULL`));
      const cities = cityResult.map(r => r.city).filter(Boolean);

      // Get unique society areas filtered by user type
      const societyResult = await db.selectDistinct({ societyArea: users.societyArea })
        .from(users)
        .where(and(userTypeFilter, sql`${users.societyArea} IS NOT NULL`));
      const societyAreas = societyResult.map(r => r.societyArea).filter(Boolean);

      // Get unique workplaces filtered by user type
      const workplaceResult = await db.selectDistinct({ workplace: users.workplace })
        .from(users)
        .where(and(userTypeFilter, sql`${users.workplace} IS NOT NULL`));
      const workplaces = workplaceResult.map(r => r.workplace).filter(Boolean);

      // Get unique activities filtered by user type
      const activityResult = await db.selectDistinct({ 
        activityName: userActivities.activityName 
      })
      .from(userActivities)
      .innerJoin(users, eq(userActivities.userId, users.id))
      .where(userTypeFilter);
      const activities = activityResult.map(r => r.activityName);

      // Get unique skill levels filtered by user type
      const skillResult = await db.selectDistinct({ 
        skillLevel: userActivities.skillLevel 
      })
      .from(userActivities)
      .innerJoin(users, eq(userActivities.userId, users.id))
      .where(userTypeFilter);
      const skillLevels = skillResult.map(r => r.skillLevel);

      return {
        cities,
        societyAreas,
        activities,
        skillLevels,
        workplaces
      };
    } else {
      // Get all values when no user type filter or userType is 'all'
      const cityResult = await db.selectDistinct({ city: users.city })
        .from(users)
        .where(sql`${users.city} IS NOT NULL`);
      const cities = cityResult.map(r => r.city).filter(Boolean);

      const societyResult = await db.selectDistinct({ societyArea: users.societyArea })
        .from(users)
        .where(sql`${users.societyArea} IS NOT NULL`);
      const societyAreas = societyResult.map(r => r.societyArea).filter(Boolean);

      const workplaceResult = await db.selectDistinct({ workplace: users.workplace })
        .from(users)
        .where(sql`${users.workplace} IS NOT NULL`);
      const workplaces = workplaceResult.map(r => r.workplace).filter(Boolean);

      const activityResult = await db.selectDistinct({ activityName: userActivities.activityName }).from(userActivities);
      const activities = activityResult.map(r => r.activityName);

      const skillResult = await db.selectDistinct({ skillLevel: userActivities.skillLevel }).from(userActivities);
      const skillLevels = skillResult.map(r => r.skillLevel);

      return {
        cities,
        societyAreas,
        activities,
        skillLevels,
        workplaces
      };
    }
  }

  async getFilterOptionsFromUsers(users: User[], userType?: string): Promise<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }> {
    // Extract unique values from the provided users array
    const cities = [...new Set(users.map(user => user.city).filter(Boolean))];
    const societyAreas = [...new Set(users.map(user => user.societyArea).filter(Boolean))];
    const workplaces = [...new Set(users.map(user => user.workplace).filter(Boolean))];
    
    // Extract activities and skill levels from user activities
    const allActivities = users.flatMap(user => user.activities || []);
    const activities = [...new Set(allActivities.map((activity: any) => activity.activityName).filter(Boolean))];
    const skillLevels = [...new Set(allActivities.map((activity: any) => activity.skillLevel).filter(Boolean))];
    
    return {
      cities: cities.sort(),
      societyAreas: societyAreas.sort(),
      activities: activities.sort(),
      skillLevels: skillLevels.sort(),
      workplaces: workplaces.sort()
    };
  }

  // Buzz Digest (News) Methods
  async createBuzzDigest(insertDigest: InsertBuzzDigest): Promise<BuzzDigest> {
    const [digest] = await db.insert(buzzDigest).values(insertDigest).returning();
    return digest;
  }

  async getBuzzDigests(limit = 20, offset = 0, userId?: number, excludeBuzzIds?: number[], sportsFilter?: number[]): Promise<BuzzDigest[]> {
    console.log('🔍 getBuzzDigests called with:', { limit, offset, userId, excludeBuzzIds, sportsFilter });
    
    if (userId) {
      // For authenticated users, include their interaction data using LEFT JOIN
      const result = await db.select({
        id: buzzDigest.id,
        sid: buzzDigest.sid,
        buzzId: buzzDigest.buzzId,
        sname: buzzDigest.sname,
        title: buzzDigest.title,
        summary: buzzDigest.summary,
        srcName: buzzDigest.srcName,
        srcLink: buzzDigest.srcLink,
        imgSrc: buzzDigest.imgSrc,
        faviconSrc: buzzDigest.faviconSrc,
        publishTime: buzzDigest.publishTime,
        likeCnt: buzzDigest.likeCnt,
        dislikeCnt: buzzDigest.dislikeCnt,
        shareCnt: buzzDigest.shareCnt,
        viewCnt: buzzDigest.viewCnt,
        createdAt: buzzDigest.createdAt,
        updatedAt: buzzDigest.updatedAt,
        liked: sql<boolean>`COALESCE(${buzzInteractions.liked}, false)::boolean`.as('liked'),
        viewed: sql<boolean>`COALESCE(${buzzInteractions.viewed}, false)::boolean`.as('viewed')
      })
      .from(buzzDigest)
      .leftJoin(buzzInteractions, and(
        eq(buzzInteractions.buzzId, buzzDigest.buzzId),
        eq(buzzInteractions.userId, userId)
      ))
      .where(and(
        excludeBuzzIds && excludeBuzzIds.length > 0 ? 
          sql`${buzzDigest.buzzId} NOT IN (${sql.join(excludeBuzzIds.map(id => sql`${id}`), sql`, `)})` : 
          undefined,
        sportsFilter && sportsFilter.length > 0 ?
          inArray(buzzDigest.sid, sportsFilter) :
          undefined
      ))
      .orderBy(desc(buzzDigest.publishTime))
      .limit(limit)
      .offset(offset);
      
      console.log('🔍 Query returned', result.length, 'results for user', userId);
      return result;
    } else {
      // For completely unauthenticated users, return data without interaction flags
      const result = await db.select().from(buzzDigest)
        .where(and(
          excludeBuzzIds && excludeBuzzIds.length > 0 ? 
            sql`${buzzDigest.buzzId} NOT IN (${sql.join(excludeBuzzIds.map(id => sql`${id}`), sql`, `)})` : 
            undefined,
          sportsFilter && sportsFilter.length > 0 ?
            inArray(buzzDigest.sid, sportsFilter) :
            undefined
        ))
        .orderBy(desc(buzzDigest.publishTime))
        .limit(limit)
        .offset(offset);
      
      // Add default liked/viewed fields
      return result.map(item => ({
        ...item,
        liked: false,
        viewed: false
      }));
    }
  }

  async getBuzzDigestById(id: number): Promise<BuzzDigest | undefined> {
    const [digest] = await db.select().from(buzzDigest).where(eq(buzzDigest.id, id));
    return digest || undefined;
  }

  async getBuzzDigestByBuzzId(buzzId: number): Promise<BuzzDigest | undefined> {
    const [digest] = await db.select().from(buzzDigest).where(eq(buzzDigest.buzzId, buzzId));
    return digest || undefined;
  }

  async getBuzzDigestBySrcLink(srcLink: string): Promise<BuzzDigest | undefined> {
    const [digest] = await db.select().from(buzzDigest).where(eq(buzzDigest.srcLink, srcLink));
    return digest || undefined;
  }

  async updateBuzzDigestCounts(buzzId: number, counts: { likeCnt?: number; dislikeCnt?: number; shareCnt?: number; viewCnt?: number }): Promise<BuzzDigest | undefined> {
    const [digest] = await db.update(buzzDigest)
      .set({ ...counts, updatedAt: new Date() })
      .where(eq(buzzDigest.buzzId, buzzId))
      .returning();
    return digest || undefined;
  }

  // Buzz Interactions Methods
  async createBuzzInteraction(insertInteraction: InsertBuzzInteraction): Promise<BuzzInteraction> {
    const [interaction] = await db.insert(buzzInteractions).values(insertInteraction).returning();
    return interaction;
  }

  async getBuzzInteraction(buzzId: number, userId: number): Promise<BuzzInteraction | undefined> {
    const [interaction] = await db.select().from(buzzInteractions)
      .where(and(
        eq(buzzInteractions.buzzId, buzzId),
        eq(buzzInteractions.userId, userId)
      ));
    return interaction || undefined;
  }

  async updateBuzzInteraction(id: number, updateData: Partial<BuzzInteraction>): Promise<BuzzInteraction | undefined> {
    const [interaction] = await db.update(buzzInteractions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(buzzInteractions.id, id))
      .returning();
    return interaction || undefined;
  }

  async getBuzzInteractionsByUser(userId: number): Promise<BuzzInteraction[]> {
    return await db.select().from(buzzInteractions)
      .where(eq(buzzInteractions.userId, userId))
      .orderBy(desc(buzzInteractions.createdAt));
  }
}

// Use PostgreSQL database storage
export const storage = new DatabaseStorage();
