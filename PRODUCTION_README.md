# StapuBox Production Package

This is the production-ready version of StapuBox, separated from development for stability.

## Quick Setup

1. **Create new Replit project** named "stapubox-working"
2. **Import this code** by uploading or cloning
3. **Install dependencies**: `npm install`
4. **Set environment variables** (see replit.md)
5. **Start application**: `npm run dev`

## Environment Variables Required

- `DATABASE_URL`: PostgreSQL connection string
- `TWOFACTOR_API_KEY`: For SMS OTP verification
- `AWS_ACCESS_KEY_ID`: For profile picture storage
- `AWS_SECRET_ACCESS_KEY`: For profile picture storage

## Domain Configuration

This instance will be proxied through stapubox.com domain. The Ubuntu server reverse proxy will forward traffic to your Replit URL.

## Production Features

✅ User authentication with OTP
✅ Multi-select search filters
✅ Interest management system
✅ Profile picture uploads
✅ StapuBuzz news integration
✅ Real-time updates and caching
✅ Production database integration

## Support

This is your stable production environment. Keep development work in the main repository and only deploy tested features here.
