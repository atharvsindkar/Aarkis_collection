import dotenv from 'dotenv';
dotenv.config();

/**
 * Validates critical environment variables before application startup.
 * The server refuses to start if any required security or core variable is missing
 * or insecure for production deployment.
 */
export function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  // Default DEBUG mode strictly to false
  if (!process.env.DEBUG || isProduction) {
    process.env.DEBUG = 'false';
  }

  // 1. JWT_SECRET (Critical Authentication Secret)
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('CRITICAL: JWT_SECRET environment variable is missing. Refusing to start.');
  } else if (isProduction) {
    if (jwtSecret.length < 32) {
      errors.push('CRITICAL: JWT_SECRET must be at least 32 characters long in production.');
    }
    if (jwtSecret.includes('dev_jwt_secret') || jwtSecret.toLowerCase().includes('default')) {
      errors.push('CRITICAL: Insecure development placeholder detected in JWT_SECRET for production.');
    }
  }

  // 2. PORT Configuration
  const port = process.env.PORT || '5001';
  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    errors.push(`INVALID: PORT environment variable (${port}) must be a valid port number between 1 and 65535.`);
  }

  // 3. FRONTEND_URL & ADMIN_URL (CORS Origins)
  const frontendUrl = process.env.FRONTEND_URL;
  const adminUrl = process.env.ADMIN_URL;
  if (isProduction) {
    if (!frontendUrl) {
      errors.push('CRITICAL: FRONTEND_URL must be explicitly configured in production (cannot default to localhost).');
    } else if (frontendUrl === '*' || frontendUrl.includes('localhost')) {
      errors.push(`CRITICAL: FRONTEND_URL cannot be wildcard (*) or localhost in production: "${frontendUrl}".`);
    }
    if (adminUrl && (adminUrl === '*' || adminUrl.includes('localhost'))) {
      errors.push(`CRITICAL: ADMIN_URL cannot be wildcard (*) or localhost in production: "${adminUrl}".`);
    }
  }

  // 4. DATABASE SECURITY
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri) {
    // If a remote MongoDB URI is provided, verify TLS/SSL and credentials
    const lowerUri = mongoUri.toLowerCase();
    if (isProduction) {
      const hasTls = lowerUri.includes('ssl=true') || lowerUri.includes('tls=true') || lowerUri.startsWith('mongodb+srv://');
      if (!hasTls) {
        errors.push('CRITICAL: Remote database connection must use TLS/SSL in production (mongodb+srv:// or ?tls=true).');
      }
      if (lowerUri.includes('admin:admin') || lowerUri.includes('root:root') || lowerUri.includes('root:toor')) {
        errors.push('CRITICAL: Insecure default database credentials detected in MONGO_URI.');
      }
    }
  }

  // 5. BOOTSTRAP OWNER PASSWORDS
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (isProduction && bootstrapPassword) {
    if (bootstrapPassword.length < 10) {
      errors.push('CRITICAL: ADMIN_BOOTSTRAP_PASSWORD must be at least 10 characters long in production.');
    }
    if (bootstrapPassword === 'AarkisOwner@2026!' || bootstrapPassword === 'admin' || bootstrapPassword === 'password') {
      errors.push('CRITICAL: ADMIN_BOOTSTRAP_PASSWORD is using a default placeholder. Rotate to a secure production secret.');
    }
  }

  // 6. THIRD-PARTY KEYS (Razorpay)
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  if (isProduction && razorpaySecret && razorpaySecret.includes('mock_secret')) {
    errors.push('CRITICAL: RAZORPAY_KEY_SECRET is using a mock test secret in production.');
  }

  // Output warnings if any
  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(`⚠️ [ENV WARNING] ${w}`));
  }

  // If any critical error is encountered, refuse to start
  if (errors.length > 0) {
    console.error('\n======================================================');
    console.error('⛔ APPLICATION FAILED PRE-FLIGHT ENVIRONMENT VALIDATION');
    console.error('======================================================');
    errors.forEach(e => console.error(` ❌ ${e}`));
    console.error('======================================================\n');
    throw new Error('Environment configuration validation failed. Server startup aborted.');
  }

  return true;
}
