import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { uploadProfilePicture, deleteProfilePicture } from "./aws-s3";
import { newsIngestionService } from "./news-ingestion";
import { 
  insertUserSchema, insertUserActivitySchema, insertInterestSchema,
  insertCareerApplicationSchema, insertInvestorInquirySchema, insertFeedItemSchema,
  insertBuzzDigestSchema, insertBuzzInteractionSchema
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

// Constants
const DAILY_INTEREST_LIMIT = 10;
const SESSION_DURATION_HOURS = 24;
const OTP_EXPIRY_MINUTES = 10;

// API Keys from environment
const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || "8e3fbee1-37bf-11f0-8b17-0200cd936042";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyDgvWsa_ZEAtV2WIJfz9h845RUrwgfoXpA";
const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY || "AIzaSyDgvWsa_ZEAtV2WIJfz9h845RUrwgfoXpA";

// Helper functions
async function sendSMS(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    const apiKey = process.env.TWOFACTOR_API_KEY || "8e3fbee1-37bf-11f0-8b17-0200cd936042";
    
    // Ensure phone number is in correct format (10 digits, no country code for India)
    const formattedPhone = phoneNumber.replace(/^\+91/, '').replace(/^91/, '');
    
    // Use correct TwoFactor OTP API format - POST method with OTP code in URL
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${formattedPhone}/${otp}`;
    
    console.log("Sending OTP via TwoFactor API");
    console.log("Phone number:", formattedPhone);
    console.log("OTP:", otp);
    console.log("URL:", url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const text = await response.text();
    console.log("TwoFactor API response:", response.status, text);
    
    // Parse response and check for success
    try {
      const data = JSON.parse(text);
      if (data.Status === "Success") {
        console.log("OTP sent successfully via TwoFactor API");
        return true;
      } else {
        console.log("TwoFactor API Error:", data.Details || data.Status);
        // Check for specific error codes
        if (data.Details && data.Details.includes("Invalid")) {
          console.log("Phone number or API key invalid");
        }
        return false;
      }
    } catch {
      // If not JSON, check for success indicators
      const success = text.includes("Success") || text.includes("success");
      console.log("OTP delivery result:", success ? "Success" : "Failed");
      console.log("Raw response:", text);
      return success;
    }
  } catch (error) {
    console.error("OTP sending error:", error);
    return false;
  }
}

async function sendInterestNotificationSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    console.log("SMS notifications disabled - would send:", message, "to", phoneNumber);
    console.log("TwoFactor API requires transactional SMS subscription for text messages");
    console.log("Current plan only supports OTP codes (4-6 digits)");
    return true; // Return success to avoid blocking interest flow
  } catch (error) {
    console.error("SMS notification error:", error);
    return false;
  }
}

function generateOTP(): string {
  // Generate 4-digit OTP as preferred
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Authentication middleware for full profile complete access
async function requireAuth(req: Request, res: Response, next: Function) {
  // Check both Authorization header and cookies for session token
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionToken;
  
  if (!sessionToken) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const session = await storage.getSession(sessionToken);
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
  
  // Require complete profile for most endpoints
  if (session.sessionType !== 'profile_complete' || !session.userId) {
    return res.status(401).json({ 
      message: "Profile completion required",
      requiresRegistration: true 
    });
  }
  
  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  
  req.user = user;
  req.session = session;
  next();
}

// Middleware for OTP verified sessions (for registration only)
async function requireOtpSession(req: Request, res: Response, next: Function) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionToken;
  
  if (!sessionToken) {
    return res.status(401).json({ message: "OTP verification required" });
  }
  
  const session = await storage.getSession(sessionToken);
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ message: "Session expired, please verify OTP again" });
  }
  
  if (session.sessionType !== 'otp_verified') {
    return res.status(400).json({ message: "Invalid session state" });
  }
  
  req.session = session;
  next();
}

// Optional authentication middleware (sets user if logged in, but doesn't require it)
async function optionalAuth(req: Request, res: Response, next: Function) {
  // Check for forceAnonymous parameter to bypass authentication
  const forceAnonymous = req.query.forceAnonymous === 'true';
  
  if (forceAnonymous) {
    console.log(`🔐 optionalAuth: FORCED ANONYMOUS MODE - bypassing all session checks`);
    next();
    return;
  }
  
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionToken;
  
  if (sessionToken) {
    try {
      const session = await storage.getSession(sessionToken);
      if (session && session.expiresAt >= new Date() && session.sessionType === 'profile_complete' && session.userId) {
        const user = await storage.getUser(session.userId);
        if (user) {
          req.user = user;
          req.session = session;
          console.log(`🔐 optionalAuth: Found valid session for User ${user.id}`);
        }
      }
    } catch (error) {
      // Ignore auth errors for optional auth
      console.log(`🔐 optionalAuth: Session error (ignoring):`, error instanceof Error ? error.message : String(error));
    }
  } else {
    console.log(`🔐 optionalAuth: No session token found - anonymous user`);
  }
  
  next();
}

// Multer configuration for file uploads
const storage_multer = multer.memoryStorage();
const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Clean up expired sessions and OTPs periodically
  setInterval(async () => {
    await storage.deleteExpiredSessions();
    await storage.deleteExpiredOtps();
  }, 60000); // Every minute

  // Admin login endpoint for testing
  app.get("/admin/login", async (req: Request, res: Response) => {
    try {
      const { userid } = req.query;
      
      if (!userid) {
        return res.redirect('/?message=invalid_userid');
      }

      // Parse userid to number
      const userId = parseInt(userid as string);
      if (isNaN(userId)) {
        return res.redirect('/?message=invalid_userid');
      }

      // Find user by ID
      const user = await storage.getUser(userId);
      if (!user) {
        // User doesn't exist, redirect to login page
        return res.redirect('/?message=user_not_found');
      }

      // Create session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
      
      // Create session
      await storage.createSession({
        userId: user.id,
        phoneNumber: user.phoneNumber,
        sessionToken,
        sessionType: 'profile_complete',
        expiresAt
      });
      
      // Set session cookie
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_DURATION_HOURS * 60 * 60 * 1000,
        sameSite: 'strict'
      });

      console.log(`🔐 ADMIN LOGIN: Logged in as ${user.name} (ID: ${user.id}) via userid: ${userid}`);

      // Redirect to home page after successful login
      res.redirect('/?message=login_success');
    } catch (error) {
      console.error("Admin login error:", error);
      res.redirect('/?message=login_error');
    }
  });

  // Authentication routes
  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = z.object({
        phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits")
      }).parse(req.body);

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await storage.createOtpVerification({
        phoneNumber,
        otp,
        expiresAt,
        verified: false
      });

      const smsSent = await sendSMS(phoneNumber, otp);

      // Always log OTP to console for development/testing
      console.log(`\n=== OTP for ${phoneNumber}: ${otp} ===\n`);

      if (!smsSent) {
        // Still return success but log the issue
        console.log("SMS delivery failed, but OTP is available in console for testing");
      }

      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phoneNumber, otp } = z.object({
        phoneNumber: z.string(),
        otp: z.string().min(4).max(6)
      }).parse(req.body);

      const verification = await storage.getOtpVerification(phoneNumber, otp);
      if (!verification || verification.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      await storage.markOtpAsVerified(verification.id);

      // Check if user exists
      const existingUser = await storage.getUserByPhoneNumber(phoneNumber);
      
      // Create session token for both cases
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
      
      if (!existingUser) {
        // Create temporary session for profile completion
        await storage.createSession({
          phoneNumber,
          userId: null,
          sessionToken,
          sessionType: "otp_verified",
          expiresAt
        });
        
        // Set session token as cookie
        res.cookie('sessionToken', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: expiresAt
        });
        
        return res.json({ 
          message: "OTP verified", 
          sessionToken,
          requiresRegistration: true 
        });
      }

      // User exists, create full session and login
      await storage.createSession({
        phoneNumber,
        userId: existingUser.id,
        sessionToken,
        sessionType: "profile_complete",
        expiresAt
      });

      // Set session token as cookie
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt
      });

      res.json({ 
        message: "Login successful", 
        sessionToken,
        user: existingUser
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      if (sessionToken) {
        await storage.deleteSession(sessionToken);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // User registration and management  
  app.post("/api/users/register", requireOtpSession, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const session = req.session;
      
      // Ensure phone number matches session
      if (userData.phoneNumber !== session.phoneNumber) {
        return res.status(400).json({ message: "Phone number doesn't match verified session" });
      }
      
      // Check if phone number is already registered
      const existingUser = await storage.getUserByPhoneNumber(userData.phoneNumber);
      if (existingUser) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      // Create user
      const user = await storage.createUser(userData);

      // Create user activities if provided
      if (req.body.activities && Array.isArray(req.body.activities)) {
        for (const activity of req.body.activities) {
          await storage.createUserActivity({
            userId: user.id,
            ...activity
          });
        }
      }

      // Update session to profile_complete after registration
      const newSessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
      
      // Delete old temporary session
      await storage.deleteSession(session.sessionToken);
      
      // Create new complete session
      await storage.createSession({
        phoneNumber: user.phoneNumber,
        userId: user.id,
        sessionToken: newSessionToken,
        sessionType: "profile_complete",
        expiresAt
      });

      // Set session token as cookie
      res.cookie('sessionToken', newSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt
      });

      res.status(201).json({ 
        message: "User registered successfully", 
        sessionToken: newSessionToken,
        user
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.get("/api/users/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const activities = await storage.getUserActivities(req.user.id);
      const userWithActivities = { ...req.user, activities };
      res.json({ user: userWithActivities, activities });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/users/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      // Handle null values for optional location fields
      const cleanedBody = {
        ...req.body,
        locationCoordinates: req.body.locationCoordinates || "",
        locationName: req.body.locationName || req.body.city || ""
      };
      
      const updateData = insertUserSchema.partial().parse(cleanedBody);
      delete updateData.phoneNumber; // Phone number cannot be changed
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update activities if provided
      if (req.body.activities && Array.isArray(req.body.activities)) {
        await storage.deleteUserActivities(req.user.id);
        for (const activity of req.body.activities) {
          await storage.createUserActivity({
            userId: req.user.id,
            ...activity
          });
        }
      }

      const activities = await storage.getUserActivities(req.user.id);
      res.json({ user: updatedUser, activities });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Profile update failed" });
    }
  });

  app.delete("/api/users/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteUserActivities(req.user.id);
      await storage.deleteUser(req.user.id);
      
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      if (sessionToken) {
        await storage.deleteSession(sessionToken);
      }
      
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Profile deletion failed" });
    }
  });

  // Profile picture upload routes
  app.post("/api/users/profile-picture", requireAuth, upload.single('profilePicture'), async (req: Request, res: Response) => {
    try {
      console.log("=== PROFILE PICTURE UPLOAD START ===");
      console.log("User ID:", req.user?.id);
      console.log("File received:", !!req.file);
      console.log("File details:", req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : "No file");
      
      if (!req.file) {
        console.log("ERROR: No image file provided");
        return res.status(400).json({ message: "No image file provided" });
      }

      // Check file size (additional check beyond multer)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Image file must be less than 5MB" });
      }

      // Validate image type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Only JPEG and PNG images are allowed" });
      }

      console.log(`User ${req.user.id} uploading profile picture: ${req.file.originalname}`);

      // Upload to S3
      console.log("Starting S3 upload...");
      const result = await uploadProfilePicture(
        req.user.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      console.log("S3 upload result:", result);
      if (!result.success) {
        console.error("S3 upload failed:", result.error);
        return res.status(500).json({ message: result.error || "Upload failed" });
      }

      // Update user profile with new image URL
      console.log("Updating database with URL:", result.url);
      const updatedUser = await storage.updateProfilePicture(req.user.id, result.url!);
      console.log("Database update result:", updatedUser ? "Success" : "Failed");
      if (!updatedUser) {
        console.log("ERROR: User not found in database for ID:", req.user.id);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Profile picture updated successfully for user ${req.user.id}: ${result.url}`);

      res.json({
        message: "Profile picture uploaded successfully",
        profilePhotoUrl: result.url,
        filename: result.filename,
        user: updatedUser
      });

    } catch (error) {
      console.error("Profile picture upload error:", error);
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "Image file must be less than 5MB" });
        }
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  app.delete("/api/users/profile-picture", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user.profilePhotoUrl) {
        return res.status(400).json({ message: "No profile picture to delete" });
      }

      // Extract filename from URL for S3 deletion
      const url = user.profilePhotoUrl;
      const filename = url.split('/').pop();
      
      if (filename) {
        // Delete from S3
        const deleted = await deleteProfilePicture(filename);
        if (!deleted) {
          console.warn(`Failed to delete profile picture from S3: ${filename}`);
        }
      }

      // Remove profile picture URL from database
      const updatedUser = await storage.updateProfilePicture(req.user.id, '');
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Profile picture deleted for user ${req.user.id}`);

      res.json({
        message: "Profile picture deleted successfully",
        user: updatedUser
      });

    } catch (error) {
      console.error("Profile picture deletion error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Deletion failed" });
    }
  });

  // Update user's dominant color
  app.put("/api/users/dominant-color", requireAuth, async (req: Request, res: Response) => {
    try {
      const { dominantColor } = z.object({
        dominantColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
      }).parse(req.body);

      const updatedUser = await storage.updateUserDominantColor(req.user.id, dominantColor);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Updated dominant color for user ${req.user.id}: ${dominantColor}`);

      res.json({
        message: "Dominant color updated successfully",
        user: updatedUser
      });

    } catch (error) {
      console.error("Dominant color update error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Update failed" });
    }
  });

  // Search and discovery
  app.get("/api/users/search", optionalAuth, async (req: Request, res: Response) => {
    try {
      const {
        userType,
        city,
        societyArea,
        activityName,
        skillLevel,
        workplace,
        minAge,
        maxAge,
        limit = "20",
        offset = "0"
      } = req.query;

      const filters: any = {};
      if (userType) filters.userType = userType;
      
      // Handle multi-select filters with OR logic
      if (city) {
        filters.cities = Array.isArray(city) ? city : [city];
      }
      if (societyArea) {
        filters.societyAreas = Array.isArray(societyArea) ? societyArea : [societyArea];
      }
      if (activityName) {
        filters.activities = Array.isArray(activityName) ? activityName : [activityName];
      }
      if (skillLevel) {
        filters.skillLevels = Array.isArray(skillLevel) ? skillLevel : [skillLevel];
      }
      if (workplace) {
        filters.workplaces = Array.isArray(workplace) ? workplace : [workplace];
      }
      
      if (minAge) filters.minAge = parseInt(minAge as string);
      if (maxAge) filters.maxAge = parseInt(maxAge as string);
      // Only exclude self for logged-in users, show ALL users for logged-out
      if (req.user) filters.excludeUserId = req.user.id;

      let users = await storage.searchUsers(filters);
      
      // CRITICAL LOGIC: Search filtering based on authentication
      if (req.user && req.user.id) {
        // For logged-in users: Exclude users with ACTIVE interest relationships
        // This includes: pending, accepted, declined - but NOT withdrawn (withdrawn allows reconnection)
        const sentInterests = await storage.getInterestsBySender(req.user.id);
        const receivedInterests = await storage.getInterestsByReceiver(req.user.id);
        
        // Get user IDs that have ACTIVE interest relationships (exclude withdrawn)
        const excludeSentUserIds = sentInterests
          .filter(interest => interest.status !== 'withdrawn')
          .map(interest => interest.receiverId);
        const excludeReceivedUserIds = receivedInterests
          .filter(interest => interest.status !== 'withdrawn')
          .map(interest => interest.senderId);
        
        // Combine and deduplicate all excluded user IDs
        const allExcludeUserIds = Array.from(new Set([...excludeSentUserIds, ...excludeReceivedUserIds]));
        
        // Filter out users with ACTIVE interest relationships (withdrawn interests allow reconnection)
        users = users.filter(user => !allExcludeUserIds.includes(user.id));
        
        console.log(`🔍 AUTHENTICATED USER ${req.user.id} search: Total users before filtering: ${users.length + allExcludeUserIds.length}, Excluded (active interests): ${allExcludeUserIds.length}, Final results: ${users.length}`);
      } else {
        // For logged-out users: Show ALL registered users (no filtering)
        console.log(`🔍 ANONYMOUS search: Showing all ${users.length} users without any filtering`);
      }

      // Pagination
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const paginatedUsers = users.slice(offsetNum, offsetNum + limitNum);

      // Get activities for each user
      const usersWithActivities = await Promise.all(
        paginatedUsers.map(async (user) => {
          const activities = await storage.getUserActivities(user.id);
          return { ...user, activities };
        })
      );

      res.json({ 
        users: usersWithActivities,
        total: users.length,
        hasMore: offsetNum + limitNum < users.length
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Get filter options based on existing data for specific user type
  app.get("/api/users/filter-options", optionalAuth, async (req: Request, res: Response) => {
    try {
      const { userType } = req.query;
      console.log(`🔍 Filter options requested for userType: "${userType}"`);
      
      let filterOptions;
      let availableUsersCount = null;
      
      // For anonymous users, return all available filter options from database
      if (!req.user) {
        console.log(`🔍 FILTER OPTIONS: Anonymous user - returning all database values`);
        filterOptions = await storage.getFilterOptions(userType as string);
      } else {
        // For logged-in users, only show filter options for users they can actually see
        console.log(`🔍 FILTER OPTIONS: Authenticated user ${req.user.id} - filtering based on available search results`);
        
        const filters: any = {};
        if (userType) filters.userType = userType;
        filters.excludeUserId = req.user.id;
        
        // Get users that would appear in search results
        let availableUsers = await storage.searchUsers(filters);
        
        // Apply the same interest filtering logic as search results
        console.log(`🔍 FILTER OPTIONS: Applying interest filtering for authenticated user ${req.user.id}`);
        
        // Get all interests for this user (sent and received)
        const [sentInterests, receivedInterests] = await Promise.all([
          storage.getInterestsBySender(req.user.id),
          storage.getInterestsByReceiver(req.user.id)
        ]);
        
        // Create set of user IDs to exclude (any interest relationship)
        const excludeUserIds = new Set<number>();
        sentInterests.forEach(interest => excludeUserIds.add(interest.receiverId));
        receivedInterests.forEach(interest => excludeUserIds.add(interest.senderId));
        
        console.log(`🔍 FILTER OPTIONS: Excluding ${excludeUserIds.size} users with existing interests`);
        
        // Filter out users with any interest relationship
        availableUsers = availableUsers.filter(user => !excludeUserIds.has(user.id));
        availableUsersCount = availableUsers.length;
        console.log(`🔍 FILTER OPTIONS: ${availableUsersCount} users available for filtering after interest exclusion`);
        
        // Extract filter options only from available users
        filterOptions = await storage.getFilterOptionsFromUsers(availableUsers, userType as string);
      }
      
      console.log(`🔍 Filter options returned:`, {
        cities: filterOptions.cities,
        societyAreas: filterOptions.societyAreas,
        activities: filterOptions.activities,
        skillLevels: filterOptions.skillLevels,
        workplaces: filterOptions.workplaces,
        userType: userType,
        isAuthenticated: !!req.user,
        ...(availableUsersCount !== null && { availableUsersCount })
      });
      
      res.json(filterOptions);
    } catch (error) {
      console.error("Get filter options error:", error);
      res.status(500).json({ message: "Failed to get filter options" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // All profiles are now public

      const activities = await storage.getUserActivities(userId);
      const userWithActivities = { ...user, activities };
      res.json({ user: userWithActivities, activities });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Interest management
  app.post("/api/interests/send", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("=== INTEREST SEND DEBUG START ===");
      console.log("Sender ID:", req.user.id);
      console.log("Request body:", req.body);
      
      const { receiverId } = z.object({
        receiverId: z.number()
      }).parse(req.body);

      console.log("Receiver ID:", receiverId);

      // Check daily limit
      const todayCount = await storage.countTodayInterestsBySender(req.user.id);
      console.log("Today's interest count:", todayCount);
      if (todayCount >= DAILY_INTEREST_LIMIT) {
        return res.status(400).json({ message: "Daily interest limit reached" });
      }

      // Check if active interest already exists (exclude withdrawn/declined)
      const existingInterest = await storage.getInterestByUsers(req.user.id, receiverId);
      console.log("Existing interest found:", existingInterest ? { 
        id: existingInterest.id, 
        status: existingInterest.status, 
        senderId: existingInterest.senderId, 
        receiverId: existingInterest.receiverId,
        sentAt: existingInterest.sentAt 
      } : "NONE");
      
      // Only block if there's a pending or accepted interest
      if (existingInterest && (existingInterest.status === "pending" || existingInterest.status === "accepted")) {
        console.log("BLOCKING - Status is:", existingInterest.status);
        return res.status(400).json({ message: "Interest already sent" });
      }
      
      console.log("ALLOWING - No blocking interest, proceeding with creation or update");

      let interest;
      
      // If there's a withdrawn or declined interest, reactivate it instead of creating new one
      if (existingInterest && (existingInterest.status === "withdrawn" || existingInterest.status === "declined")) {
        console.log("UPDATING existing interest from", existingInterest.status, "to pending");
        interest = await storage.updateInterest(existingInterest.id, {
          status: "pending",
          sentAt: new Date(),
          respondedAt: null
        });
      } else {
        console.log("CREATING new interest");
        // Create interest only if no existing interest found
        interest = await storage.createInterest({
          senderId: req.user.id,
          receiverId,
          status: "pending"
        });
      }

      // Send SMS notification to receiver
      const receiver = await storage.getUser(receiverId);
      if (receiver) {
        console.log(`Interest notification: ${req.user.name} sent interest to ${receiver.name} (${receiver.phoneNumber})`);
        
        // Create deeplink URL for interests received page
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
          : 'http://localhost:5000';
        const deeplinkUrl = `${baseUrl}/interests?tab=received`;
        
        // Create SMS message for interest received (extremely simple to avoid URL encoding issues)
        const message = `${req.user.name} sent connection request on StapuBox`;
        
        // Send SMS notification
        await sendInterestNotificationSMS(receiver.phoneNumber, message);
      }

      res.status(201).json({ interest, message: "Interest sent successfully" });
    } catch (error) {
      console.error("Send interest error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to send interest" });
    }
  });

  app.get("/api/interests/received", requireAuth, async (req: Request, res: Response) => {
    try {
      const interests = await storage.getInterestsByReceiver(req.user.id);
      
      // Get sender details for each interest
      const interestsWithSenders = await Promise.all(
        interests.map(async (interest) => {
          const sender = await storage.getUser(interest.senderId);
          const senderActivities = sender ? await storage.getUserActivities(sender.id) : [];
          return { 
            ...interest, 
            sender: sender ? { ...sender, activities: senderActivities } : null 
          };
        })
      );

      res.json({ interests: interestsWithSenders });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch received interests" });
    }
  });

  app.get("/api/interests/sent", requireAuth, async (req: Request, res: Response) => {
    try {
      const interests = await storage.getInterestsBySender(req.user.id);
      
      // Get receiver details for each interest
      const interestsWithReceivers = await Promise.all(
        interests.map(async (interest) => {
          const receiver = await storage.getUser(interest.receiverId);
          const receiverActivities = receiver ? await storage.getUserActivities(receiver.id) : [];
          return { 
            ...interest, 
            receiver: receiver ? { ...receiver, activities: receiverActivities } : null 
          };
        })
      );

      res.json({ interests: interestsWithReceivers });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sent interests" });
    }
  });

  app.put("/api/interests/:id/accept", requireAuth, async (req: Request, res: Response) => {
    try {
      const interestId = parseInt(req.params.id);
      const interest = await storage.getInterest(interestId);
      
      if (!interest || interest.receiverId !== req.user.id) {
        return res.status(404).json({ message: "Interest not found" });
      }

      if (interest.status !== 'pending') {
        return res.status(400).json({ message: "Interest already responded to" });
      }

      // Update interest status
      const updatedInterest = await storage.updateInterest(interestId, { status: 'accepted' });

      // Get sender details
      const sender = await storage.getUser(interest.senderId);
      
      if (sender && updatedInterest) {
        // Create deeplink URL for interests accepted/sent page
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
          : 'http://localhost:5000';
        const deeplinkUrl = `${baseUrl}/interests?tab=sent`;
        
        // Send SMS notification to sender about acceptance (extremely simple to avoid URL encoding issues)
        const message = `${req.user.name} accepted your connection request on StapuBox`;
        
        await sendInterestNotificationSMS(sender.phoneNumber, message);
      }

      res.json({ interest: updatedInterest, message: "Interest accepted successfully" });
    } catch (error) {
      console.error("Accept interest error:", error);
      res.status(500).json({ message: "Failed to accept interest" });
    }
  });

  app.put("/api/interests/:id/decline", requireAuth, async (req: Request, res: Response) => {
    try {
      const interestId = parseInt(req.params.id);
      const interest = await storage.getInterest(interestId);
      
      if (!interest || interest.receiverId !== req.user.id) {
        return res.status(404).json({ message: "Interest not found" });
      }

      if (interest.status !== 'pending') {
        return res.status(400).json({ message: "Interest already responded to" });
      }

      // Update interest status
      const updatedInterest = await storage.updateInterest(interestId, { status: 'declined' });

      res.json({ interest: updatedInterest, message: "Interest declined" });
    } catch (error) {
      res.status(500).json({ message: "Failed to decline interest" });
    }
  });

  app.put("/api/interests/:id/withdraw", requireAuth, async (req: Request, res: Response) => {
    try {
      const interestId = parseInt(req.params.id);
      const interest = await storage.getInterest(interestId);
      
      if (!interest || (interest.senderId !== req.user.id && interest.receiverId !== req.user.id)) {
        return res.status(404).json({ message: "Interest not found" });
      }

      // Allow withdrawal of any interest regardless of status
      const updatedInterest = await storage.updateInterest(interestId, { status: 'withdrawn' });

      res.json({ interest: updatedInterest, message: "Interest withdrawn successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to withdraw interest" });
    }
  });

  app.delete("/api/interests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const interestId = parseInt(req.params.id);
      const interest = await storage.getInterest(interestId);
      
      if (!interest || interest.senderId !== req.user.id) {
        return res.status(404).json({ message: "Interest not found" });
      }

      if (interest.status !== 'pending') {
        return res.status(400).json({ message: "Cannot delete responded interest" });
      }

      // Update interest status to withdrawn
      await storage.updateInterest(interestId, { status: 'withdrawn' });

      res.json({ message: "Interest withdrawn successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to withdraw interest" });
    }
  });

  // Get pending interests count
  app.get("/api/interests/pending-count", requireAuth, async (req: Request, res: Response) => {
    try {
      const receivedInterests = await storage.getInterestsByReceiver(req.user.id);
      const pendingCount = receivedInterests.filter(interest => interest.status === 'pending').length;
      res.json({ count: pendingCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to get pending interests count" });
    }
  });

  // Feed management
  app.get("/api/feed", async (req: Request, res: Response) => {
    try {
      const { limit = "20", offset = "0" } = req.query;
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      
      const feedItems = await storage.getFeedItems(limitNum, offsetNum);
      
      // If user is logged in, check which items they've liked
      let feedWithLikes = feedItems;
      if (req.user) {
        feedWithLikes = await Promise.all(
          feedItems.map(async (item) => {
            const userLike = await storage.getFeedLike(req.user.id, item.id);
            return { ...item, isLiked: !!userLike };
          })
        );
      }

      res.json({ feedItems: feedWithLikes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.post("/api/feed/:id/like", requireAuth, async (req: Request, res: Response) => {
    try {
      const feedItemId = parseInt(req.params.id);
      
      // Check if already liked
      const existingLike = await storage.getFeedLike(req.user.id, feedItemId);
      if (existingLike) {
        // Unlike
        await storage.deleteFeedLike(req.user.id, feedItemId);
        await storage.updateFeedItemLikes(feedItemId, -1);
        res.json({ message: "Feed item unliked", isLiked: false });
      } else {
        // Like
        await storage.createFeedLike(req.user.id, feedItemId);
        await storage.updateFeedItemLikes(feedItemId, 1);
        res.json({ message: "Feed item liked", isLiked: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Static forms
  app.post("/api/applications/career", async (req: Request, res: Response) => {
    try {
      const application = insertCareerApplicationSchema.parse(req.body);
      const createdApplication = await storage.createCareerApplication(application);
      
      // Send email notification to info@stapubox.com
      const { sendEmail, createCareerApplicationEmail } = await import('./email.js');
      const emailParams = createCareerApplicationEmail(application);
      const emailSent = await sendEmail(emailParams);
      
      if (!emailSent) {
        console.warn("Email notification failed for career application");
      }
      
      res.status(201).json({ application: createdApplication, message: "Application submitted successfully" });
    } catch (error) {
      console.error("Career application error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Application submission failed" });
    }
  });

  app.post("/api/applications/investor", async (req: Request, res: Response) => {
    try {
      const inquiry = insertInvestorInquirySchema.parse(req.body);
      const createdInquiry = await storage.createInvestorInquiry(inquiry);
      
      // Send email notification to info@stapubox.com
      const { sendEmail, createInvestorInquiryEmail } = await import('./email.js');
      const emailParams = createInvestorInquiryEmail(inquiry);
      const emailSent = await sendEmail(emailParams);
      
      if (!emailSent) {
        console.warn("Email notification failed for investor inquiry");
      }
      
      res.status(201).json({ inquiry: createdInquiry, message: "Inquiry submitted successfully" });
    } catch (error) {
      console.error("Investor inquiry error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Inquiry submission failed" });
    }
  });

  // File upload placeholder endpoints
  app.post("/api/upload/profile-photo", requireAuth, async (req: Request, res: Response) => {
    // TODO: Implement Google Drive integration for profile photo upload
    res.json({ 
      message: "File upload endpoint ready for Google Drive integration",
      uploadUrl: "https://example.com/placeholder-image.jpg"
    });
  });

  app.post("/api/upload/resume", async (req: Request, res: Response) => {
    // TODO: Implement Google Drive integration for resume upload
    res.json({ 
      message: "File upload endpoint ready for Google Drive integration",
      uploadUrl: "https://example.com/placeholder-resume.pdf"
    });
  });

  // Google Places API endpoints
  app.get("/api/places/search", async (req: Request, res: Response) => {
    try {
      const { query, location = "28.5355,77.3910", radius = "50000" } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Places search error:", error);
      res.status(500).json({ error: "Failed to search places" });
    }
  });

  app.get("/api/places/details", async (req: Request, res: Response) => {
    try {
      const { place_id, fields = "name,formatted_address,geometry" } = req.query;
      
      if (!place_id || typeof place_id !== 'string') {
        return res.status(400).json({ error: "Place ID is required" });
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Place details error:", error);
      res.status(500).json({ error: "Failed to get place details" });
    }
  });

  // StapuBuzz API integration
  app.get("/api/stapubuzz/news", async (req: Request, res: Response) => {
    try {
      const { sids = '', page = '1', cnt = '10' } = req.query;
      
      // Build URL for external StapuBuzz API
      const baseUrl = 'https://stapubox.com/buzz/digest/api';
      const params = new URLSearchParams();
      
      if (sids) params.append('sids', sids as string);
      params.append('page', page as string);
      params.append('cnt', cnt as string);
      
      const apiUrl = `${baseUrl}?${params.toString()}`;
      
      // Fetch from external API
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`StapuBuzz API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract buzz_digest from response
      const buzzDigest = data.data?.buzz_digest || [];
      
      res.json({ data: buzzDigest });
    } catch (error) {
      console.error('StapuBuzz API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch news',
        message: 'Unable to connect to StapuBuzz service'
      });
    }
  });

  app.post("/api/stapubuzz/interact", async (req: Request, res: Response) => {
    try {
      const { buzzId, userId, spectatorCode, action, value } = req.body;
      
      if (!buzzId || !action) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // For now, just log the interaction
      // In production, you would store this in the stapubuzz_interactions table
      console.log('StapuBuzz interaction:', {
        buzzId,
        userId,
        spectatorCode,
        action,
        value,
        timestamp: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('StapuBuzz interaction error:', error);
      res.status(500).json({ error: 'Failed to record interaction' });
    }
  });

  // Admin password-based authentication
  app.post('/api/admin/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const authorizedEmails = [
      'ankiteshiiita@gmail.com',
      'nakumar987@gmail.com', 
      'shubhamraj01@gmail.com'
    ];
    
    if (email && authorizedEmails.includes(email) && password === 'batman') {
      // Create admin session hash
      const adminHash = Buffer.from(`${email}:${Date.now()}:stapuadmin`).toString('base64');
      
      // Set secure cookie
      res.cookie('stapu_p', adminHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      });
      
      // Store admin session
      req.session = req.session || {};
      req.session.adminUser = {
        email,
        name: email.split('@')[0],
        loginTime: new Date().toISOString(),
        hash: adminHash
      };
      
      res.json({ success: true, user: req.session.adminUser });
    } else {
      res.status(403).json({ error: 'Invalid email or password' });
    }
  });

  // Admin auth check
  app.get('/api/admin/auth', async (req, res) => {
    const adminCookie = req.cookies?.stapu_p;
    
    if (adminCookie && req.session?.adminUser) {
      // Validate cookie hash matches session
      if (req.session.adminUser.hash === adminCookie) {
        res.json(req.session.adminUser);
      } else {
        res.status(401).json({ message: 'Invalid session' });
      }
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Admin logout
  app.post('/api/admin/logout', async (req, res) => {
    // Clear admin session
    if (req.session) {
      delete req.session.adminUser;
    }
    
    // Clear admin cookie
    res.clearCookie('stapu_p', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.json({ success: true });
  });

  app.get('/api/admin/tables', async (req, res) => {
    try {
      // Get all data from storage to display in admin dashboard
      const users = await storage.searchUsers({});
      const careerApplications = await storage.getCareerApplications();
      const investorInquiries = await storage.getInvestorInquiries();
      const feedItems = await storage.getFeedItems();
      
      // Format data for admin dashboard
      const allInterests = [];
      const allUserActivities = [];
      
      for (const user of users) {
        const userInterestsSent = await storage.getInterestsBySender(user.id);
        const userInterestsReceived = await storage.getInterestsByReceiver(user.id);
        const userActivities = await storage.getUserActivities(user.id);
        
        allInterests.push(...userInterestsSent, ...userInterestsReceived);
        allUserActivities.push(...userActivities);
      }

      res.json({
        users,
        user_activities: allUserActivities,
        interests: allInterests,
        career_applications: careerApplications,
        investor_inquiries: investorInquiries,
        feed_items: feedItems,
        feed_likes: [], // Would implement if needed
        sessions: [], // Would implement if needed
        otp_verifications: [] // Would implement if needed
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      res.status(500).json({ message: "Failed to fetch admin data" });
    }
  });

  app.delete('/api/admin/tables/:table/:id', async (req, res) => {
    try {
      const { table, id } = req.params;
      const recordId = parseInt(id);
      
      // Delete record based on table type
      switch (table) {
        case 'users':
          await storage.deleteUser(recordId);
          break;
        case 'interests':
          // Would implement delete interest method
          break;
        // Add other table delete methods as needed
        default:
          return res.status(400).json({ message: 'Invalid table' });
      }
      
      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      console.error("Error deleting record:", error);
      res.status(500).json({ message: "Failed to delete record" });
    }
  });

  // News/Buzz Digest API endpoints
  app.get("/api/news", optionalAuth, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const highlightBuzzId = req.query.highlight_buzz_id ? parseInt(req.query.highlight_buzz_id as string) : null;
      const accSrc = req.query.acc_src as string; // Encrypted user ID for tracking
      const sportsFilter = req.query.sports as string; // Comma-separated sports IDs
      
      // Get user ID for like status checking
      const userId = req.user?.id;
      
      // Log page visits with tracking parameters
      if (highlightBuzzId || accSrc) {
        console.log(`📊 StapuBuzz Page Visit - buzz_id: ${highlightBuzzId}, acc_src: ${accSrc ? '[ENCRYPTED]' : 'none'}, user: ${userId || 'anonymous'}`);
      }
      
      let newsItems = [];
      let excludeBuzzIds = [];
      
      // If highlighting a specific buzz_id, fetch and prioritize it first
      if (highlightBuzzId) {
        const highlightedItem = await storage.getBuzzDigestByBuzzId(highlightBuzzId);
        if (highlightedItem) {
          // Get interaction data for the highlighted item
          const interaction = userId 
            ? await storage.getBuzzInteraction(highlightedItem.buzzId, userId)
            : null;
          
          // Add interaction flags to the highlighted item
          const itemWithInteraction = {
            ...highlightedItem,
            liked: interaction?.liked || false,
            viewed: interaction?.viewed || false
          };
          
          newsItems.push(itemWithInteraction);
          excludeBuzzIds.push(highlightBuzzId);
        }
      }
      
      // Parse sports filter
      const sportsFilterArray = sportsFilter ? sportsFilter.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : undefined;
      
      // Debug sports filtering
      if (sportsFilterArray && sportsFilterArray.length > 0) {
        console.log(`🏅 Sports Filter Applied: ${sportsFilterArray.join(', ')}`);
      }
      
      // Get regular news items, excluding the highlighted one
      const regularNewsItems = await storage.getBuzzDigests(
        limit, 
        offset, 
        userId, 
        excludeBuzzIds,
        sportsFilterArray
      );
      
      // Combine highlighted item (if any) with regular items
      newsItems = [...newsItems, ...regularNewsItems];
      
      // Add cache-busting headers for debugging
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.json({ news: newsItems, page, limit });
    } catch (error) {
      console.error("News fetch error:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.post("/api/news/:id/like", requireAuth, async (req: Request, res: Response) => {
    try {
      const buzzId = parseInt(req.params.id);
      
      // Get the news item by buzzId
      const newsItem = await storage.getBuzzDigestByBuzzId(buzzId);
      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }

      // Check existing interaction using buzzId and userId
      let interaction = await storage.getBuzzInteraction(buzzId, req.user.id);

      if (!interaction) {
        // Create new interaction
        interaction = await storage.createBuzzInteraction({
          buzzId: buzzId, // Use buzzId as the identifier
          userId: req.user.id,
          liked: true,
          likedAt: new Date()
        });
      } else {
        // Toggle like status
        const newLikedStatus = !interaction.liked;
        interaction = await storage.updateBuzzInteraction(interaction.id, {
          liked: newLikedStatus,
          likedAt: newLikedStatus ? new Date() : null
        });
      }

      // Update the news item's like count
      let updatedLikeCnt = newsItem.likeCnt || 0;
      if (newsItem) {
        const increment = interaction!.liked ? 1 : -1;
        updatedLikeCnt = Math.max(0, (newsItem.likeCnt || 0) + increment);
        await storage.updateBuzzDigestCounts(buzzId, {
          likeCnt: updatedLikeCnt
        });
      }

      res.json({ 
        message: interaction!.liked ? "News liked" : "News unliked",
        liked: interaction!.liked,
        likeCnt: updatedLikeCnt
      });
    } catch (error) {
      console.error("News like error:", error);
      res.status(500).json({ message: "Failed to process like" });
    }
  });

  app.post("/api/news/:id/share", requireAuth, async (req: Request, res: Response) => {
    try {
      const buzzId = parseInt(req.params.id);
      
      // Get the news item by external buzz_id
      const shareNewsItem = await storage.getBuzzDigestByBuzzId(buzzId);
      if (!shareNewsItem) {
        return res.status(404).json({ message: "News item not found" });
      }

      let interaction = await storage.getBuzzInteraction(
        shareNewsItem.buzzId, 
        req.user.id
      );

      if (!interaction) {
        // Create new interaction
        interaction = await storage.createBuzzInteraction({
          buzzId: shareNewsItem.buzzId,
          userId: req.user.id,
          shared: true,
          sharedAt: new Date()
        });
      } else {
        // Update share status
        interaction = await storage.updateBuzzInteraction(interaction.id, {
          shared: true,
          sharedAt: new Date()
        });
      }

      // Update the news item's share count
      if (shareNewsItem) {
        await storage.updateBuzzDigestCounts(shareNewsItem.id, {
          shareCnt: (shareNewsItem.shareCnt || 0) + 1
        });
      }

      res.json({ message: "News shared successfully" });
    } catch (error) {
      console.error("News share error:", error);
      res.status(500).json({ message: "Failed to process share" });
    }
  });

  // Manual news ingestion trigger (for testing)
  app.post("/api/admin/ingest-news", async (req: Request, res: Response) => {
    try {
      await newsIngestionService.manualIngest();
      res.json({ message: "News ingestion completed successfully" });
    } catch (error) {
      console.error("Manual ingestion error:", error);
      res.status(500).json({ message: "News ingestion failed" });
    }
  });

  // Start periodic news ingestion
  console.log("🚀 Starting news ingestion service...");
  try {
    newsIngestionService.startPeriodicIngestion();
    console.log("✅ News ingestion service started successfully");
  } catch (error) {
    console.error("❌ Failed to start news ingestion service:", error);
    // Continue with app startup even if news ingestion fails
  }

  const httpServer = createServer(app);
  return httpServer;
}
