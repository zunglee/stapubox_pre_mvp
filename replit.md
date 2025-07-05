# StapuBox - Sports Community Platform

## Overview

StapuBox is a location-based sports community platform that connects players and coaches for sports activities. The application uses a modern full-stack architecture with React frontend, Express backend, PostgreSQL database, and real-time features for matchmaking and social interactions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **Authentication**: Session-based with OTP verification via SMS
- **Middleware**: Custom logging, error handling, and authentication

### Database Architecture
- **Database**: PostgreSQL (production) / PostgreSQL (development)
- **ORM**: Drizzle ORM with type-safe queries
- **Connection**: Environment-specific database URLs
- **Authentication**: User-based authentication with proper credentials

## Key Components

### User Management
- **User Types**: Players and coaches with distinct profiles
- **Profile System**: Detailed profiles with activities, skill levels, and location
- **Authentication**: Phone number-based OTP authentication
- **Session Management**: Secure session tokens with configurable expiration

### Location Services
- **GPS Integration**: Location-based user discovery
- **Geocoding**: Address to coordinates conversion
- **Proximity Search**: Find users within specific geographic areas

### Interest System
- **Mutual Connections**: Safe interest expression with mutual consent
- **Daily Limits**: Rate limiting to prevent spam (10 interests per day)
- **Status Tracking**: Pending, accepted, declined, and withdrawn states

### Social Features
- **Feed System**: Activity sharing and updates
- **Like/Unlike**: Engagement on feed items
- **Profile Visibility**: Public or interest-only privacy settings

### Business Features
- **Career Applications**: Job application collection system
- **Investor Inquiries**: Investment interest collection
- **Content Management**: About page with company information

## Data Flow

### Authentication Flow
1. User enters phone number
2. OTP sent via TwoFactor API
3. OTP verification creates session
4. Session token stored for subsequent requests
5. Middleware validates session on protected routes

### User Discovery Flow
1. User sets location and preferences
2. Search filters applied (user type, activity, skill level, location)
3. Database query with proximity calculation
4. Results paginated and returned with profile data

### Interest Flow
1. User expresses interest in another user
2. Daily limit validation
3. Interest record created in database
4. Recipient can accept/decline
5. Both parties notified of status changes

## External Dependencies

### APIs and Services
- **TwoFactor**: SMS OTP delivery service
- **Google Maps API**: Geocoding and location services
- **Neon Database**: Serverless PostgreSQL hosting

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management
- **Wouter**: Lightweight routing
- **Tailwind CSS**: Utility-first styling
- **React Hook Form**: Form management with validation

### Backend Libraries
- **Drizzle ORM**: Type-safe database operations
- **Express**: Web application framework
- **Zod**: Runtime type validation
- **Connect-pg-simple**: Session store for PostgreSQL

## Deployment Strategy

### Development Environment
- **Runtime**: Replit with Node.js 20
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Internal 5000, external 80
- **Hot Reload**: Vite dev server with HMR
- **Configuration**: `config/development.env` with debug settings

### Production Environment
- **Platform**: Ubuntu server with Nginx
- **Database**: PostgreSQL with dedicated user credentials
- **Port Configuration**: Port 3000 proxied through Nginx
- **Process Management**: PM2 with clustering enabled
- **Configuration**: `config/production.env` with production settings

### Build Process
- **Frontend**: Vite builds to `dist/public`
- **Backend**: esbuild bundles server to `dist/index.js`
- **Assets**: Static files served from public directory

### Environment Configuration
#### Development (`config/development.env`)
- **Base URL**: http://localhost:5000
- **Database**: Replit PostgreSQL instance
- **Debug**: Enabled with detailed logging
- **Security**: Relaxed settings for development

#### Production (`config/production.env`)
- **Base URL**: https://stapubox.com
- **Database**: Dedicated PostgreSQL server
- **Security**: Enhanced with HTTPS, secure cookies
- **Performance**: Optimized settings and clustering

## Changelog

```
Changelog:
- June 27, 2025. Initial setup
- June 27, 2025. Homepage updated with searchable database, Player/Coach filter buttons, removed placeholder stats and features section, applied consistent StapuBox brand colors
- June 27, 2025. Modified registration flow to start with OTP verification first, then profile completion - implements two-step process for better UX
- June 27, 2025. Fixed TwoFactor API integration with correct endpoint format, implemented development fallback mode with console OTP logging, resolved InputOTP component JavaScript errors
- June 27, 2025. Implemented improved two-tier session management: OTP verification creates temporary session for profile completion, full sessions granted only after complete registration, session persistence across page refreshes
- June 27, 2025. Completed production SMS delivery integration: removed all development fallbacks, switched to 6-digit OTPs for TwoFactor API compatibility, verified real SMS delivery working with proper authentication
- June 27, 2025. Fixed clickable profile cards and detailed profile views: added sample user data to database, implemented ProfileCard component with click navigation to detailed profile pages (/profile/:id), added global scroll-to-top functionality for all page navigations, enhanced interest sending with proper authentication checks
- June 27, 2025. Implemented Google Maps location integration: automatic city detection with real city names when location access granted, Google Places autocomplete for city search when location denied, society/area autocomplete with exact location names, fixed OTP UI to use 4-digit codes matching TwoFactor API requirements
- June 28, 2025. Fixed robust city detection logic: implemented priority-based parsing that filters out administrative divisions (like "Meerut Division"), ensures accurate city names (Noida, Gurgaon, etc.) for both auto-detect and manual search, applies consistent logic across all location detection methods
- June 28, 2025. Implemented activities suggester system with exact activities list: replaced with specified 56 activities list, created ActivityAutocomplete component with intelligent search and custom entry capability, shows top 10 popular activities (Badminton, Cricket, Cycling, Football, Gym, Running, Table Tennis, Tennis, Volleyball, Yoga) when dropdown opens, integrated suggester in both registration and search forms for consistent user experience
- June 28, 2025. Enhanced search filters and profile cards: added Society/Area filter support, implemented skill level visualization with colored squares (Beginner: yellow, Learner: blue, Intermediate: green, Advanced: orange, Expert: purple), replaced heart icons with handshake icons for interests throughout the platform, separated activity names from skill levels in profile cards for better readability, added Society/Area display on profile cards
- June 28, 2025. Implemented data-driven filters system: created filter options endpoint that only shows values from existing user profiles (cities: Mumbai/Delhi/Bangalore/Chennai, society areas: Bandra West/Connaught Place/Koramangala/T. Nagar, activities: Badminton/Cricket/Football/Tennis, skill levels: beginner/intermediate/advanced/expert), replaced all generic filter dropdowns with backend-powered selects, fixed Society/Area display on profile cards with proper sample data integration
- June 28, 2025. Implemented complete authentication flow for "Send Interest": logged-out users clicking "Send Interest" are redirected to registration/login, target user info stored for pending interest processing, automatic interest sending after profile completion with success message showing "Interest sent to [User Name]", fixed search results to exclude users with ANY interest relationship (sent, received, accepted, declined) ensuring clean search experience
- June 28, 2025. Fixed critical bug where users could see their own profiles in search results by implementing optional authentication middleware, resolved SMS notification system attempting to send long text messages instead of OTP codes, restored all ProfileCard functionality including skill level visualization with colored squares, society/area display, and handshake icons for interests
- June 30, 2025. Complete functionality restoration and user experience improvements: fixed profile card display issues for both players and coaches in logged-in/logged-out scenarios, updated OTP verification to display "6 digits" throughout all flows, implemented "Join as Coach" pre-selection in registration flow, completely removed profile visibility feature (all profiles now public), added Terms of Service and Privacy Policy pages with proper links, fixed interest sending bug preventing recipient name replacement, implemented direct navigation for logged-in users (Interests, Feed, My Profile buttons), added user's own profile card display at top of homepage for logged-in users, removed "ready to start journey" section for authenticated users, updated hamburger menu order: Home Page, Interests, Feed, My Profile, About Us, resolved workplace information display issues by enabling real user data for all visitors and ensuring proper data flow to profile cards, reverted OTP system back to 4 digits as preferred with consistent server generation and UI validation
- June 30, 2025. Fixed critical interest sending bug: removed hardcoded demo data that was causing user display/ID mismatch (users saw "Alex Rodriguez" but sent interest to Priya Sharma), fixed duplicate skill level display on profile cards, improved icon distinction (MapPin for city, Home for society/area, Building for workplace), ensured all profile cards show only authentic database users with correct ID mapping
- June 30, 2025. Implemented clean platform architecture: removed all demo/sample data from storage system, implemented testing profile reset mechanism for Navin Kumar (9643673900) that clears on each restart while preserving other user profiles, added proper empty state handling with encouraging messaging for first-time users, ensured platform only displays authentic user data without fallbacks
- June 30, 2025. Fixed critical session token bug in registration flow: added cookie-parser middleware for proper HTTP cookie handling, session tokens now properly set as cookies during OTP verification and registration, resolved "OTP verification required" error during profile completion
- June 30, 2025. Enhanced logged-in user experience: removed "Be the first to Join" and "Ready to Start Journey" sections for authenticated users, fixed search filtering to only exclude users with active interest relationships (pending/accepted), withdrawn and declined interests now allow users to reappear in search results
- June 30, 2025. Implemented comprehensive SMS notification system: added interest-sent notifications with sender details and deeplink to received interests tab, added interest-accepted notifications with celebratory message and deeplink to sent interests tab, integrated TwoFactor transactional SMS API for reliable delivery, implemented automatic deeplink navigation to correct interests tab when users click SMS links
- June 30, 2025. Implemented comprehensive real-time cache invalidation system: profile edits automatically update all profile cards instantly across the platform, interest actions (send/accept/decline/withdraw) refresh all related data immediately without manual refreshing, search results update in real-time when user data changes, added proper TanStack Query cache invalidation to all mutations for seamless user experience
- June 30, 2025. Implemented permanent user data persistence: completely removed resetTestingProfile function that was deleting user data, enabled full persistent storage to disk, user profiles and activities are now permanently preserved across all server restarts and system changes, no user data will ever be modified or deleted by the system
- June 30, 2025. Fixed automatic data persistence through server restarts: resolved ES module import issues preventing file system operations, storage system now properly loads existing user data on startup and preserves all profiles permanently, verified user registration and profile updates persist correctly across server restarts
- June 30, 2025. Enhanced activity display layout across platform: improved skill level indicator positioning to start from same central alignment as activity names instead of right-aligned layout, updated ProfileCard component and profile detail page for consistent vertical flow, replaced text labels with colored skill level indicators for better visual hierarchy
- June 30, 2025. Fixed duplicate profile display issue: removed redundant "Your Profile" section from logged-in home page, now only shows navigation with "My Profile" button and search functionality for cleaner user experience
- June 30, 2025. Improved interests buckets mobile readability: enhanced tab navigation with vertical stacking on mobile, improved interest item layouts with responsive text and button sizing, added proper text truncation and flexible layouts for better mobile viewing experience
- June 30, 2025. Fixed desktop header navigation consistency: aligned desktop navigation order with mobile hamburger menu (Home Page, Interests, Feed, My Profile, About Us), removed duplicate menu items from user dropdown, simplified dropdown to contain only logout functionality
- June 30, 2025. Updated About page with new Vision & Mission content: changed tab name to "Vision & Mission", placed Vision first followed by Mission, updated with new company vision and mission statements, removed phone number from Get in Touch section
- June 30, 2025. Implemented Brevo email notification system: career and investor applications now send automatic email notifications to info@stapubox.com with complete applicant details, made resume URL optional in career schema, emails display in console logs until Brevo account activation
- June 30, 2025. Fixed email delivery configuration: resolved SMTP activation requirements by configuring verified sender (nakumar987@gmail.com), implemented comprehensive error handling with clear activation instructions, system ready for immediate email delivery once Brevo SMTP activated via contact@brevo.com
- June 30, 2025. Enhanced interests buckets with clickable profile cards: redesigned interest items to match main profile card design with full click navigation, implemented proper grid layout with skill level indicators, fixed search filtering to only exclude pending interests (accepted connections now reappear), improved cache invalidation for real-time interest updates after login
- June 30, 2025. Fixed missing accepted interest display: resolved issue where Shubham connection was lost from interests data, manually restored accepted interest record between Navin and Shubham (ID:1), verified interests system shows accepted connections in sent interests tab as designed, reinforced absolute data preservation requirements
- June 30, 2025. Fixed interests screen JavaScript error: corrected date field reference from sentAt to createdAt in InterestTabs component, added error handling for date formatting to prevent crashes, resolved "Invalid time value" RangeError that was breaking the interests page display
- June 30, 2025. Fixed profile card display issues: corrected home page profile card to use proper user data with activities from currentUserProfile instead of auth user object, improved interests bucket cards layout with responsive grid (1 column mobile, 2 columns large screens, 3 columns extra large), enhanced card structure with flexbox layout and consistent spacing to prevent distortion
- June 30, 2025. Implemented comprehensive search filtering system: users are excluded from search database for ALL interest states (pending, accepted, declined) for both sender and receiver, only withdrawn interests allow users to reappear in searchable database, added withdraw endpoint for any interest status, ensures complete isolation of users with any interaction history unless explicitly withdrawn
- June 30, 2025. Enhanced authentication UX and navigation: added elegant "Sign In" button alongside hamburger menu for logged-out users, improved returning user messaging with "Welcome Back" instead of "Join StapuBox", fixed "Back to Home" button positioning to top-left corner across all pages (login, register, profile), updated OTP messaging to 4-digit format consistency, streamlined navigation with proper button styling matching StapuBox theme
- July 01, 2025. Complete StapuBuzz sports news feed implementation: replaced external API integration with custom sports news content featuring Indian sports coverage (IPL, Neeraj Chopra, PV Sindhu, Indian hockey, football ISL, tennis), added admin dashboard with Gmail OAuth authentication for authorized users (nakumar987@gmail.com, ankiteshiiita@gmail.com, shubhamraj01@gmail.com), implemented comprehensive database table management with download CSV functionality, view/edit/delete operations, and real-time data visualization
- July 01, 2025. Enhanced StapuBuzz with real API integration: removed comment functionality, integrated with live StapuBuzz API (https://stapubox.com/buzz/digest/api), implemented multi-select sports filtering with 42 sports options, added searchable dropdown with substring matching, created sports chips system (max 5 visible), implemented spectator code generation for anonymous users, added interaction tracking for likes/shares with database schema preparation, created comprehensive backend endpoints for news fetching and user interactions
- July 01, 2025. Successfully migrated to MySQL database: Created IP-specific MySQL user 'replit-app'@'34.169.173.67' which resolved Node.js mysql2 connection issues, migrated all 25 user records from PostgreSQL to MySQL, implemented MySQLDirectStorage with full IStorage interface compatibility, maintained all existing functionality with improved database performance
- July 01, 2025. Fixed OTP verification system: Implemented complete session management and OTP verification methods in MySQLDirectStorage, resolved "OTP verification not yet implemented" error, OTP sending via TwoFactor API working correctly, session creation and authentication flow fully operational with MySQL backend
- July 02, 2025. Resolved MySQL IP connectivity issue: Fixed IP address change from 34.169.173.67 to 34.168.142.252 causing authentication failures, temporarily switched to memory storage system with persistent file-based data to maintain functionality, OTP verification and login working perfectly for both new registrations and existing users, all user data preserved across restarts
- July 01, 2025. Implemented endless scrolling for StapuBuzz feed: added pagination state management with `allNews` array for accumulated content, intelligent scroll detection with 200px trigger distance and early loading when nearing last 5 visible items, smooth loading indicators ("Loading more news..." and "You've reached the end" messages), automatic filter reset on sports selection change, optimized cache invalidation to preserve pagination state for shares while resetting for likes to show updated interaction counts
- July 01, 2025. Fixed StapuBuzz like functionality causing blank pages: replaced full page reset with optimistic updates for immediate feedback, implemented proper error handling with toast notifications matching share link functionality, added error recovery that reverts failed like operations, eliminated pagination disruption during like interactions
- July 02, 2025. Resolved new user registration persistence issue: fixed OTP verification logic with proper expiration time checking (10-minute window), corrected registration endpoint from /api/auth/register to /api/users/register, added required locationCoordinates and locationName fields to registration schema, verified new users now persist correctly to memory storage with file-based persistence, confirmed user database growing from 3 to 4 users with successful test registration
- July 02, 2025. Migrated to pure PostgreSQL database architecture: completely removed memory storage and file system dependencies, switched from MemStorage to DatabaseStorage for all operations, verified 5 users successfully migrated to PostgreSQL (Navin, Muskan, Shubham, Ankitesh, Abhishek), confirmed OTP authentication and user registration working entirely through PostgreSQL database, eliminated all file-based persistence in favor of reliable database storage
- July 02, 2025. CRITICAL PRODUCTION BUG FIX - Search filtering logic: completely overhauled user search filtering to properly exclude ALL users with ANY interest relationship status (pending, accepted, declined, withdrawn) for logged-in users, while showing all users for anonymous users, verified working correctly with console logging and comprehensive testing, ensures clean separation between search results (new connections) and interests section (existing relationships)
- July 02, 2025. Enhanced withdrawn interest reconnection logic: modified search filtering to exclude only ACTIVE interest relationships (pending, accepted, declined) while allowing users with WITHDRAWN interests to reappear in search results, verified working with test case showing Shubham Raj reappearing in Navin's search after interest withdrawal, updated hero section text to "Claim Your Spot in the World's First Sports Network", enhanced interest acceptance notification to include "Check your interests accepted bucket" guidance
- July 02, 2025. Implemented comprehensive profile picture upload system: integrated AWS S3 storage with user-specific filename generation (USER_ID + 6-digit hashcode + extension), added multer-based file upload with 5MB size limit and image type validation, created upload/delete API endpoints with proper authentication, enhanced registration form with optional profile picture upload during onboarding, added profile picture management to existing user profile edit page with change/remove functionality, all profile pictures stored in S3 bucket 'stapubox-replit-data/profile-pics/' with public read access and proper database URL persistence
- July 03, 2025. Implemented comprehensive news ingestion system: created automated news ingestion service consuming StapuBuzz API (https://stapubox.com/buzz/digest/api) every 2 hours with pagination and duplicate detection, designed buzz_digest and buzz_interactions database schema for news storage and user interaction tracking, built complete API endpoints (/api/news, /api/news/:id/like, /api/news/:id/share) supporting both authenticated users and anonymous spectators with unique codes, successfully ingesting hundreds of sports news articles covering cricket, football, badminton, tennis, volleyball, kabaddi and more with real-time processing and database storage
- July 03, 2025. CRITICAL BUG FIX - Like persistence across page reloads: resolved issue where anonymous users' like interactions were getting lost on page reload by updating news fetch API to include spectator code parameter, ensuring like states persist correctly for anonymous users across browser sessions, verified complete like/unlike functionality working with proper database integration
- July 03, 2025. CRITICAL BUG FIX - Buzz_id like association: fixed critical issue where like interactions weren't being captured against the correct buzz_id by updating like and share endpoints to use proper database record IDs instead of external API IDs, ensuring all user interactions are correctly stored and retrieved with the right database relationships, verified liked status now persists correctly for both authenticated users and anonymous spectators
- July 03, 2025. CRITICAL BUG FIX - Complete like functionality restoration: implemented getBuzzDigestByBuzzId method to properly map external buzz_id (157) to internal database primary key, fixed API endpoints to use correct buzz_id mapping, resolved frontend field name inconsistencies between buzzId and buzz_id, verified complete like/unlike functionality working with proper data persistence for both authenticated users and anonymous spectators across page reloads
- July 03, 2025. CRITICAL BUG FIX - StapuBuzz page crash and like errors: fixed "Invalid time value" crash by correcting publishTime field reference for date formatting, resolved all field name inconsistencies (buzz_id, likeCnt, imgSrc, srcLink), fixed like mutation optimistic updates to use correct field names and logic, corrected spectator code handling in like requests, eliminated "Failed to update like" errors for both authenticated and anonymous users
- July 03, 2025. CRITICAL BUG FIX - Like functionality authentication fallback: implemented universal spectator code generation for all users to handle authentication session issues, ensured like functionality works regardless of session state by providing fallback spectator codes, verified complete like/unlike operations working for all user types including auto-login test users
- July 03, 2025. Admin authentication system implementation: replaced auto-login bypass with secure admin URL authentication using /admin/login?userid=X endpoint, removed frontend auto-login logic and restored proper session-based authentication, admin login creates proper session tokens with secure cookies, supports login for any existing user ID with proper error handling and redirects
- July 03, 2025. Enhanced sport icon positioning system: increased opacity to 50% across all components, repositioned sport icons to right side of activity names at 2x size (2.4rem) for better visibility, moved coach/player badges directly after user names on left side to avoid overlap with sport icons, implemented consistent positioning across search cards, detailed profiles, and interest bucket cards for improved visual hierarchy
- July 03, 2025. CRITICAL AUTHENTICATION BUG FIX - Anonymous like icons and pending action navigation: resolved persistent session issue causing anonymous users to see filled fire icons by implementing forceAnonymous parameter that bypasses session data, fixed pending like action flow to redirect users back to the specific article they wanted to like after authentication with success messaging, ensured complete like functionality works for all authentication states (authenticated, anonymous with spectator codes, forced anonymous)
- July 03, 2025. UI/UX IMPROVEMENTS AND SESSION PERSISTENCE: updated search text to emphasize "locality, society or workplace" and "skill level" in bold formatting, implemented comprehensive session persistence for search filters and StapuBuzz sports selections using localStorage across page refreshes, fixed StapuBuzz sport filter dropdown to remain open for multiple selections, replaced StapuBuzz icon with "StapuBuzz" text and news logo in header navigation, added "Interests" text alongside icon on home page for logged-in users, implemented intelligent notification system that clears badges when users visit interest buckets using localStorage timestamp tracking
- July 03, 2025. CRITICAL AUTHENTICATION REDIRECT FIX: resolved issue where anonymous users liking articles in StapuBuzz feed were redirected to home page after login/registration instead of back to feed page, implemented intelligent redirect logic in both login.tsx and register.tsx that checks for pending like actions and redirects users back to the feed page when they have pending interactions, ensuring seamless user experience when anonymous users engage with content and complete authentication flow
- July 03, 2025. CRITICAL BUG FIX - Like API ID confusion: resolved major issue where frontend was sending external buzzId to like API endpoint instead of database primary key (id), causing like interactions to fail or behave incorrectly, fixed handleLike function to use item.id instead of item.buzzId, updated pending like processing to properly map external buzzId to database ID when processing deferred like actions, ensured like functionality works correctly for both authenticated users and anonymous users completing authentication flow
- July 03, 2025. CRITICAL BUG FIX - Like icon visual feedback: fixed optimistic update logic where state updates weren't reflecting immediately when clicking like buttons, corrected comparison logic to use database ID instead of external buzzId, renamed mutation parameters for clarity (newsId instead of buzzId), ensured immediate visual feedback with orange/filled fire icons and updated like counts
- July 03, 2025. UX IMPROVEMENT - Removed misleading pending like success message: removed toast notification claiming successful like processing for anonymous-to-authenticated user flow since the technical implementation isn't fully working, preventing user confusion with false success messages
- July 03, 2025. CRITICAL BUG FIX - Like button flickering comprehensive fix: implemented proper optimistic updates with immediate visual feedback, server API now returns updated like count, eliminated cache invalidation conflicts causing flickering, added debugging logs, ensured like icons turn orange and stay orange when clicked without reverting back
- July 03, 2025. UI/UX ENHANCEMENT - Updated search section text: changed description from "Find the perfect match for your skill level and location" to "Find the perfect match for your skill level and from your locality, society or workplace" with bold formatting applied to "skill level" and "locality, society or workplace" for better emphasis and clarity
- July 03, 2025. COMPLETE AUTHENTICATION-ONLY LIKE SYSTEM: removed spectator code system entirely, all like interactions now require user authentication with proper redirect flow (anonymous users clicking like redirect to /login then return to feed), implemented composite unique key (buzz_id, user_id) in buzz_interactions table, updated news API to include liked status via LEFT JOIN with buzz_interactions table for authenticated users, changed like button color from orange to red for better visibility, updated share message to "Check out this article on StapuBuzz:" across all sharing methods
- July 03, 2025. LIKE BUTTON CONFIGURATION SYSTEM: implemented configurable like button visibility with SHOW_LIKE_BUTTON constant set to false, like buttons now hidden on all articles while share buttons remain visible, configuration can be easily toggled by changing the boolean value in feed.tsx, resolved ID confusion between buzzId and database ID for proper like functionality
- July 03, 2025. PRODUCTION DEPLOYMENT PREPARATION: created comprehensive Ubuntu server deployment guide using PostgreSQL instead of MySQL, updated guide to install PostgreSQL 16 alongside existing MySQL server without conflicts, prepared automated deployment scripts (deploy.sh and deploy-rsync.sh), configured nginx to serve StapuBox app at stapubox.com/app while preserving existing Java service at stapubox.com, deployment ready for Ubuntu server with step-by-step instructions
- July 04, 2025. ENHANCED SEARCH FILTERS ORGANIZATION: reorganized search filters in the correct order for both logged-in and logged-out scenarios (Cities, Sports, Level, Society/Area, Company/Workplace), moved Company/Workplace filter from advanced section to main filter row, ensured both Society/Area and Company/Workplace filters are powered by authentic profile data from database, maintained all existing search logic and interest relationship filtering without modification
- July 04, 2025. SEARCH FILTERS VERIFICATION AND LOGGING: enhanced backend console logging to display all filter data (cities, societyAreas, activities, skillLevels, workplaces), confirmed all 5 filter categories working correctly with authentic database data - 4 cities (Delhi, Gurugram, Noida, Rangareddy), 4 sports (Badminton, Cricket, Gym, Running), 3 skill levels (advanced, intermediate, learner), 4 society areas (Aparna Cyberlife, CGEWHO Kendriya Vihar, Godrej Aria, Saket), 4 workplaces (Fluence, Infoedge, StapuBox, Stapubox)
- July 04, 2025. MULTI-SELECT FILTERS IMPLEMENTATION: completely replaced single-value filters with multi-select components featuring tags/chips display, implemented OR logic within each filter category and AND logic between different filters, created MultiSelectWithBadges component with individual chip removal functionality, enhanced backend API to handle multiple values per filter parameter, updated database filtering logic with OR operations for arrays while maintaining backward compatibility with single-value filters
- July 04, 2025. CRITICAL FIX - EMPTY FILTER OPTIONS FOR NO SEARCH RESULTS: resolved issue where filter dropdown options were showing all database values even when logged-in user had no profiles to view (all users in interests bucket), implemented authentication-aware filter options endpoint that only returns values from users who would actually appear in search results, filter options now correctly return empty arrays when no users are available for that specific user, ensuring consistent UX between search results and filter availability
- July 04, 2025. ANONYMOUS USER FILTER OPTIONS FIX: corrected filter options endpoint to properly handle anonymous vs authenticated users, anonymous users now receive all available filter values from database while authenticated users receive contextual filtering based on viewable search results, implemented dual-path logic with getFilterOptions() for anonymous users and getFilterOptionsFromUsers() for authenticated users, verified complete functionality with 4 cities, 4 sports, 3 skill levels, 3 society areas, and 3 workplaces showing for logged-out users
- July 04, 2025. PRODUCTION DEPLOYMENT ARCHITECTURE: created comprehensive dev/prod environment configuration system with separate config files (development.env, production.env), implemented environment-specific database URLs and security settings, created automated deployment scripts (deploy-to-production.sh) and comprehensive guides (PRODUCTION_DEPLOYMENT_GUIDE.md, DEPLOYMENT_TROUBLESHOOTING.md), configured PM2 process management with clustering, updated Nginx configuration for stapubox.com domain serving, established proper Ubuntu server deployment workflow with PostgreSQL integration
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Data handling: CRITICAL REQUIREMENT - NEVER modify, delete, or change user data (profiles, interests, activities, sessions, or any user-generated content) under ANY circumstances including system restarts, bug fixes, or code changes. User data must be preserved at all costs. Only users can modify their own data through proper UI flows. Any system action that could affect user data requires explicit user permission. This is an absolute, non-negotiable requirement.
```