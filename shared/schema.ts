import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number", { length: 15 }).notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  userType: text("user_type", { enum: ["player", "coach"] }).notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  age: integer("age").notNull(),
  workplace: text("workplace").notNull(),
  bio: text("bio"),
  profilePhotoUrl: text("profile_photo_url"),
  dominantColor: text("dominant_color"), // Hex color extracted from profile photo
  locationCoordinates: text("location_coordinates").notNull(),
  locationName: text("location_name").notNull(),
  city: text("city").notNull(),
  societyArea: text("society_area"),
  profileVisibility: text("profile_visibility", { enum: ["public", "interest_only"] }).notNull().default("public"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityName: text("activity_name").notNull(),
  skillLevel: text("skill_level", { enum: ["beginner", "learner", "intermediate", "advanced", "expert"] }).notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  coachingExperienceYears: integer("coaching_experience_years"),
  certifications: text("certifications"),
});

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted", "declined", "withdrawn"] }).notNull().default("pending"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => ({
  unq: unique().on(table.senderId, table.receiverId),
}));

export const careerApplications = pgTable("career_applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  resumeUrl: text("resume_url"),
  contributionArea: text("contribution_area").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const investorInquiries = pgTable("investor_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  businessEmail: text("business_email").notNull(),
  phone: text("phone").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const feedItems = pgTable("feed_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  likeCount: integer("like_count").notNull().default(0),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
});

export const feedLikes = pgTable("feed_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  feedItemId: integer("feed_item_id").notNull().references(() => feedItems.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  unq: unique().on(table.userId, table.feedItemId),
}));

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
  sessionToken: text("session_token").notNull().unique(),
  sessionType: text("session_type", { enum: ["otp_verified", "profile_complete"] }).notNull().default("otp_verified"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// StapuBuzz News Tables
export const buzzDigest = pgTable("buzz_digest", {
  id: serial("id").primaryKey(),
  sid: integer("sid").notNull(), // Original API sid
  buzzId: integer("buzz_id").notNull().unique(), // Unique buzz_id as primary identifier
  sname: text("sname").notNull(), // Sport name
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  srcName: text("src_name").notNull(),
  srcLink: text("src_link").notNull().unique(), // Unique constraint for duplicate detection
  imgSrc: text("img_src"),
  faviconSrc: text("favicon_src"),
  publishTime: timestamp("publish_time").notNull(),
  likeCnt: integer("like_cnt").default(0),
  dislikeCnt: integer("dislike_cnt").default(0),
  shareCnt: integer("share_cnt").default(0),
  viewCnt: integer("view_cnt").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const buzzInteractions = pgTable("buzz_interactions", {
  id: serial("id").primaryKey(),
  buzzId: integer("buzz_id").notNull().references(() => buzzDigest.buzzId),
  userId: integer("user_id").notNull().references(() => users.id),
  liked: boolean("liked").notNull().default(false),
  disliked: boolean("disliked").notNull().default(false),
  shared: boolean("shared").notNull().default(false),
  viewed: boolean("viewed").notNull().default(false),
  likedAt: timestamp("liked_at"),
  dislikedAt: timestamp("disliked_at"),
  sharedAt: timestamp("shared_at"),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Composite unique key for buzz_id and user_id
  uniqueBuzzUser: unique().on(table.buzzId, table.userId),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
});

export const insertInterestSchema = createInsertSchema(interests).omit({
  id: true,
  sentAt: true,
  respondedAt: true,
});

export const insertCareerApplicationSchema = createInsertSchema(careerApplications).omit({
  id: true,
  submittedAt: true,
});

export const insertInvestorInquirySchema = createInsertSchema(investorInquiries).omit({
  id: true,
  submittedAt: true,
});

export const insertFeedItemSchema = createInsertSchema(feedItems).omit({
  id: true,
  publishedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
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
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type Interest = typeof interests.$inferSelect;
export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type CareerApplication = typeof careerApplications.$inferSelect;
export type InsertCareerApplication = z.infer<typeof insertCareerApplicationSchema>;
export type InvestorInquiry = typeof investorInquiries.$inferSelect;
export type InsertInvestorInquiry = z.infer<typeof insertInvestorInquirySchema>;
export type FeedItem = typeof feedItems.$inferSelect;
export type InsertFeedItem = z.infer<typeof insertFeedItemSchema>;
export type FeedLike = typeof feedLikes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type BuzzDigest = typeof buzzDigest.$inferSelect;
export type InsertBuzzDigest = z.infer<typeof insertBuzzDigestSchema>;
export type BuzzInteraction = typeof buzzInteractions.$inferSelect;
export type InsertBuzzInteraction = z.infer<typeof insertBuzzInteractionSchema>;
