import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { validateEnvironment } from './config/validateEnv.js';
import { connectDB } from './config/db.js';
import { bootstrapOwner } from './services/bootstrap.js';
import { seedInitialData } from './services/seed.js';
import { syncAllCategoryStatuses } from './services/categorySync.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { globalErrorHandler, generateCorrelationId } from './middleware/errorHandler.js';

import adminAuthRoutes from './routes/adminAuth.js';
import adminDashboardRoutes from './routes/adminDashboard.js';
import adminOrdersRoutes from './routes/adminOrders.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import couponsRoutes from './routes/coupons.js';
import ordersRoutes from './routes/orders.js';
import newsletterRoutes from './routes/newsletter.js';
import uploadRoutes from './routes/upload.js';
import customerAuthRoutes from './routes/customerAuth.js';

dotenv.config();

// 1. ENVIRONMENT VARIABLES & PRE-FLIGHT VALIDATION
// Refuse to start if any critical security variable is missing or insecure
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === 'production';

// Trust reverse proxy (for accurate client IP rate limiting in cloud/load-balancer environments)
app.set('trust proxy', 1);

// 2. CORRELATION ID MIDDLEWARE (Tracks requests and correlates logs without leaking internal details)
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  res.setHeader('X-Correlation-Id', req.correlationId);
  next();
});

// 3. SECURITY HEADERS VIA HELMET & REINFORCING MIDDLEWARE
// Content-Security-Policy restricting scripts to domain 'self' and trusted checkout gateway
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://checkout.razorpay.com",
          !isProduction ? "'unsafe-inline'" : "'self'",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https://api.razorpay.com"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
  })
);

// Guarantee critical headers on every single response:
// X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Strict-Transport-Security: max-age 1 year
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// 4. CORS CONFIGURATION: Strict origin validation — never allow wildcard (*)
// Supports separate storefront and dedicated admin panel domains
const parseOrigins = (raw) => {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
};

const allowedOrigins = [
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.ADMIN_URL),
  !isProduction ? 'http://localhost:5173' : null,
  !isProduction ? 'http://localhost:5174' : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, mobile native)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: Origin "${origin}" is not authorized.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-Id'],
    maxAge: 86400, // 24-hour preflight cache
  })
);

// Standard parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Morgan logging (suppress in production or use combined)
if (!isProduction) {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api', apiLimiter);

// 5. API ROUTES
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminAuthRoutes); // Aliased for legacy admin routes
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customer/auth', customerAuthRoutes);

// Static uploads serving
app.use('/uploads', express.static('public/uploads'));

// Health check endpoint (generic, no internal database architecture leaks)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Aarkis Collection Production API',
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler for API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    correlationId: req.correlationId
  });
});

// 6. GLOBAL CENTRALIZED ERROR HANDLER
// Catches all synchronous and asynchronous errors without leaking stack traces or internal details
app.use(globalErrorHandler);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    await bootstrapOwner();
    await seedInitialData();
    await syncAllCategoryStatuses();

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`✨ Aarkis Collection Backend Server Running on Port: ${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔒 Security & Hardening: 7 Pre-Deployment Checks Active`);
      console.log(`🛡️ Rate Limiting, CSP, HSTS, CORS & Error Shielding ENFORCED`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
