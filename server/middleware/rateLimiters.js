import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Global API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Login Rate Limiter:
 * Strictly enforces minimum: 5 attempts per minute per IP on login.
 */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: isDev ? 60 : 5, // 5 attempts per minute in production (generous in local dev)
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 1 minute before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP Request & Verification Rate Limiter:
 * Limits OTP requests and verification attempts to 5 per minute per IP.
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: isDev ? 60 : 5, // 5 attempts per minute in production
  message: {
    success: false,
    message: 'Too many authentication code requests. Please wait 1 minute before retrying.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password Reset Rate Limiter:
 * Strictly enforces minimum: 3 attempts per hour per IP on password reset.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'Too many password reset requests. Please wait 1 hour before attempting again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Coupon validation rate limiter
export const couponLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isDev ? 100 : 20,
  message: {
    success: false,
    message: 'Too many coupon validation requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
