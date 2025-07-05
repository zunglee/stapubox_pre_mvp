import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development';
const configPath = resolve(__dirname, `${environment}.env`);

console.log(`🔧 Loading ${environment} configuration from: ${configPath}`);

// Load the environment file
config({ path: configPath });

// Configuration interface
export interface AppConfig {
  // Environment
  NODE_ENV: string;
  
  // Server
  BASE_URL: string;
  PORT: number;
  HOST: string;
  
  // Database
  DATABASE_URL: string;
  PGHOST: string;
  PGPORT: number;
  PGUSER: string;
  PGPASSWORD: string;
  PGDATABASE: string;
  
  // API Keys
  TWOFACTOR_API_KEY: string;
  BREVO_API_KEY?: string;
  GOOGLE_MAPS_API_KEY: string;
  
  // AWS S3
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION: string;
  AWS_S3_BUCKET_NAME: string;
  
  // Session
  SESSION_SECRET: string;
  SESSION_COOKIE_SECURE: boolean;
  SESSION_COOKIE_HTTPONLY: boolean;
  SESSION_COOKIE_MAX_AGE: number;
  
  // CORS
  CORS_ORIGIN: string;
  CORS_CREDENTIALS: boolean;
  
  // Logging
  LOG_LEVEL: string;
  ENABLE_REQUEST_LOGGING: boolean;
  
  // StapuBuzz API
  STAPUBUZZ_API_URL: string;
  STAPUBUZZ_API_KEY: string;
  STAPUBUZZ_SOURCE_UTM: string;
  
  // Feature Flags
  FORCE_ANONYMOUS_MODE: boolean;
  ENABLE_DEBUG_LOGGING: boolean;
  SKIP_EMAIL_SENDING: boolean;
}

// Parse and validate configuration
const appConfig: AppConfig = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server
  BASE_URL: process.env.BASE_URL || 'http://localhost:5000',
  PORT: parseInt(process.env.PORT || '5000'),
  HOST: process.env.HOST || '0.0.0.0',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  PGHOST: process.env.PGHOST || 'localhost',
  PGPORT: parseInt(process.env.PGPORT || '5432'),
  PGUSER: process.env.PGUSER || 'postgres',
  PGPASSWORD: process.env.PGPASSWORD || '',
  PGDATABASE: process.env.PGDATABASE || 'replit',
  
  // API Keys
  TWOFACTOR_API_KEY: process.env.TWOFACTOR_API_KEY || '',
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  
  // AWS S3
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'eu-north-1',
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'stapubox-replit-data',
  
  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'fallback_secret_change_in_production',
  SESSION_COOKIE_SECURE: process.env.SESSION_COOKIE_SECURE === 'true',
  SESSION_COOKIE_HTTPONLY: process.env.SESSION_COOKIE_HTTPONLY !== 'false',
  SESSION_COOKIE_MAX_AGE: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '86400000'),
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5000',
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS !== 'false',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING === 'true',
  
  // StapuBuzz API
  STAPUBUZZ_API_URL: process.env.STAPUBUZZ_API_URL || 'https://stapubox.com/buzz/digest/api',
  STAPUBUZZ_API_KEY: process.env.STAPUBUZZ_API_KEY || 'iMBatman',
  STAPUBUZZ_SOURCE_UTM: process.env.STAPUBUZZ_SOURCE_UTM || 'replit',
  
  // Feature Flags
  FORCE_ANONYMOUS_MODE: process.env.FORCE_ANONYMOUS_MODE === 'true',
  ENABLE_DEBUG_LOGGING: process.env.ENABLE_DEBUG_LOGGING === 'true',
  SKIP_EMAIL_SENDING: process.env.SKIP_EMAIL_SENDING === 'true',
};

// Validation
const requiredFields = [
  'DATABASE_URL',
  'TWOFACTOR_API_KEY',
  'GOOGLE_MAPS_API_KEY',
  'SESSION_SECRET'
];

for (const field of requiredFields) {
  if (!appConfig[field as keyof AppConfig]) {
    console.error(`❌ Missing required configuration: ${field}`);
    process.exit(1);
  }
}

console.log(`✅ Configuration loaded successfully for ${environment} environment`);
console.log(`📊 Server will run on: ${appConfig.BASE_URL}:${appConfig.PORT}`);
console.log(`🗄️  Database: ${appConfig.PGDATABASE} at ${appConfig.PGHOST}:${appConfig.PGPORT}`);

export default appConfig;