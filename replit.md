# StapuBox Production - Sports Community Platform

## Overview

This is the **production** version of StapuBox, separated from the development environment for stability and reliability. This instance is designed to serve real users through stapubox.com domain.

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
- **Database**: PostgreSQL (production)
- **ORM**: Drizzle ORM with type-safe queries
- **Connection**: Production database URL
- **Authentication**: User-based authentication with proper credentials

## Production Configuration

### Environment Variables
```
NODE_ENV=production
DATABASE_URL=postgresql://replit-user:replit-password@db.thin.dev:5432/replit-db
TWOFACTOR_API_KEY=[Your API Key]
AWS_ACCESS_KEY_ID=[Your AWS Key]
AWS_SECRET_ACCESS_KEY=[Your AWS Secret]
```

### Domain Setup
- **Production URL**: https://stapubox.com
- **Replit URL**: https://stapubox-working.replit.app
- **Proxy Setup**: Ubuntu server reverse proxy to Replit

## Key Features

### User Management
- Phone number-based OTP authentication
- Player and coach profile types
- Profile picture upload with AWS S3
- Location-based user discovery

### Search & Filtering
- Multi-select filters for sports, skill levels, locations
- Real-time search with database integration
- Interest relationship filtering

### Social Features
- Interest sending and management
- Feed system with real-time updates
- Like/unlike functionality
- SMS notifications

### StapuBuzz News Integration
- Automated news ingestion from StapuBuzz API
- Multi-sport filtering system
- Like and share functionality
- Anonymous user support with spectator codes

## Deployment Strategy

This production instance serves as the stable backend for stapubox.com while development continues in the main repository.

### Reverse Proxy Setup
Ubuntu server (srv837052) runs nginx reverse proxy:
```nginx
location / {
    proxy_pass https://stapubox-working.replit.app;
    proxy_set_header Host stapubox-working.replit.app;
    # ... additional proxy settings
}
```

## Changelog - Production Version

```
- July 05, 2025: Created production-separated instance from main development codebase
- Complete StapuBox functionality: authentication, search, interests, news feed
- Production database configuration with PostgreSQL
- AWS S3 integration for profile pictures
- TwoFactor SMS integration for OTP
- Multi-select filtering system
- StapuBuzz news integration
- Real-time cache invalidation
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Data handling: CRITICAL REQUIREMENT - NEVER modify, delete, or change user data (profiles, interests, activities, sessions, or any user-generated content) under ANY circumstances. User data must be preserved at all costs.
Environment: Production - prioritize stability and performance over experimental features.
```
