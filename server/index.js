import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { bootstrapOwner } from './services/bootstrap.js';
import { seedInitialData } from './services/seed.js';
import { apiLimiter } from './middleware/rateLimiters.js';

import adminAuthRoutes from './routes/adminAuth.js';
import adminDashboardRoutes from './routes/adminDashboard.js';
import adminOrdersRoutes from './routes/adminOrders.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import couponsRoutes from './routes/coupons.js';
import ordersRoutes from './routes/orders.js';
import newsletterRoutes from './routes/newsletter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Apply rate limiting to all /api/ endpoints
app.use('/api', apiLimiter);

// API Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminAuthRoutes); // Aliased for /api/admin/login, /api/admin/me, /api/admin/users
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Aarkis Collection Backend API',
    environment: process.env.NODE_ENV || 'development',
    time: new Date(),
  });
});

// Start Server
const startServer = async () => {
  await connectDB();
  await bootstrapOwner();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`✨ Aarkis Collection Backend Server Running on Port: ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`👑 Initial Admin Owner: ${process.env.ADMIN_BOOTSTRAP_EMAIL || 'owner@aarkiscollection.com'}`);
    console.log(`======================================================\n`);
  });
};

startServer();

export default app;
