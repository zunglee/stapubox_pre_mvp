import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  boolean,
  json,
  decimal,
  index,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(),
  userType: varchar("user_type", { length: 20 }).notNull(), // 'player' or 'coach'
  dateOfBirth: varchar("date_of_birth", { length: 20 }).notNull(),
  age: int("age").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  societyArea: varchar("society_area", { length: 100 }).notNull(),
  workplace: varchar("workplace", { length: 100 }).notNull(),
  bio: text("bio"),
  profilePhotoUrl: varchar("profile_photo_url", { length: 500 }),
  dominantColor: varchar("dominant_color", { length: 20 }),
  locationCoordinates: varchar("location_coordinates", { length: 100 }),
  locationName: varchar("location_name", { length: 200 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User activities table
export const userActivities = mysqlTable("user_activities", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  activity: varchar("activity", { length: 100 }).notNull(),
  skillLevel: varchar("skill_level", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interests table
export const interests = mysqlTable("interests", {
  id: int("id").primaryKey().autoincrement(),
  senderId: int("sender_id").notNull(),
  receiverId: int("receiver_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table
export const sessions = mysqlTable("sessions", {
  id: int("id").primaryKey().autoincrement(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  userId: int("user_id"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP verifications table
export const otpVerifications = mysqlTable("otp_verifications", {
  id: int("id").primaryKey().autoincrement(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  otp: varchar("otp", { length: 10 }).notNull(),
  isVerified: boolean("is_verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feed items table
export const feedItems = mysqlTable("feed_items", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  likesCount: int("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feed likes table
export const feedLikes = mysqlTable("feed_likes", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  feedItemId: int("feed_item_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Career applications table
export const careerApplications = mysqlTable("career_applications", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  experience: varchar("experience", { length: 50 }).notNull(),
  resumeUrl: varchar("resume_url", { length: 500 }),
  coverLetter: text("cover_letter"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Investor inquiries table
export const investorInquiries = mysqlTable("investor_inquiries", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  company: varchar("company", { length: 100 }),
  investmentRange: varchar("investment_range", { length: 50 }).notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Buzz digest table (for StapuBuzz news)
export const buzzDigest = mysqlTable("buzz_digest", {
  id: int("id").primaryKey().autoincrement(),
  sid: int("sid").notNull(),
  buzzId: int("buzz_id").notNull().unique(),
  sname: varchar("sname", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  publishTime: varchar("publish_time", { length: 50 }).notNull(),
  imgSrc: varchar("img_src", { length: 1000 }),
  srcLink: varchar("src_link", { length: 1000 }).notNull(),
  likeCnt: int("like_cnt").default(0),
  shareCnt: int("share_cnt").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  buzzIdIndex: index("buzz_id_idx").on(table.buzzId),
  snameIndex: index("sname_idx").on(table.sname),
}));

// Buzz interactions table (for likes/shares)
export const buzzInteractions = mysqlTable("buzz_interactions", {
  id: int("id").primaryKey().autoincrement(),
  buzzId: int("buzz_id").notNull(),
  userId: int("user_id"),
  spectatorCode: varchar("spectator_code", { length: 100 }),
  interactionType: varchar("interaction_type", { length: 20 }).notNull(), // 'like', 'share'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  buzzUserIndex: index("buzz_user_idx").on(table.buzzId, table.userId),
  spectatorIndex: index("spectator_idx").on(table.spectatorCode),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;
export type Interest = typeof interests.$inferSelect;
export type InsertInterest = typeof interests.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = typeof otpVerifications.$inferInsert;
export type FeedItem = typeof feedItems.$inferSelect;
export type InsertFeedItem = typeof feedItems.$inferInsert;
export type FeedLike = typeof feedLikes.$inferSelect;
export type InsertFeedLike = typeof feedLikes.$inferInsert;
export type CareerApplication = typeof careerApplications.$inferSelect;
export type InsertCareerApplication = typeof careerApplications.$inferInsert;
export type InvestorInquiry = typeof investorInquiries.$inferSelect;
export type InsertInvestorInquiry = typeof investorInquiries.$inferInsert;
export type BuzzDigest = typeof buzzDigest.$inferSelect;
export type InsertBuzzDigest = typeof buzzDigest.$inferInsert;
export type BuzzInteraction = typeof buzzInteractions.$inferSelect;
export type InsertBuzzInteraction = typeof buzzInteractions.$inferInsert;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterestSchema = createInsertSchema(interests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertFeedItemSchema = createInsertSchema(feedItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCareerApplicationSchema = createInsertSchema(careerApplications).omit({
  id: true,
  createdAt: true,
});

export const insertInvestorInquirySchema = createInsertSchema(investorInquiries).omit({
  id: true,
  createdAt: true,
});

export const insertBuzzDigestSchema = createInsertSchema(buzzDigest).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBuzzInteractionSchema = createInsertSchema(buzzInteractions).omit({
  id: true,
  createdAt: true,
});