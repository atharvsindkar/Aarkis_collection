import Datastore from 'nedb-promises';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve('server/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
}

// Create persistent local datastores that use standard MongoDB query syntax
// In-process architecture: No open TCP database port exposed to the internet
export const usersDB = Datastore.create({ filename: path.join(dataDir, 'users.db'), autoload: true });
export const productsDB = Datastore.create({ filename: path.join(dataDir, 'products.db'), autoload: true });
export const categoriesDB = Datastore.create({ filename: path.join(dataDir, 'categories.db'), autoload: true });
export const ordersDB = Datastore.create({ filename: path.join(dataDir, 'orders.db'), autoload: true });
export const couponsDB = Datastore.create({ filename: path.join(dataDir, 'coupons.db'), autoload: true });
export const subscribersDB = Datastore.create({ filename: path.join(dataDir, 'subscribers.db'), autoload: true });
export const auditLogsDB = Datastore.create({ filename: path.join(dataDir, 'audit_logs.db'), autoload: true });

export const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGO_URI;

  if (mongoUri) {
    const lower = mongoUri.toLowerCase();
    // Verify TLS/SSL for remote production database
    if (isProduction && !lower.startsWith('mongodb+srv://') && !lower.includes('tls=true') && !lower.includes('ssl=true')) {
      throw new Error('Database Security Violation: Remote MongoDB connection must use TLS/SSL in production (?tls=true or mongodb+srv://).');
    }
    // Verify non-default credentials
    if (lower.includes('admin:admin') || lower.includes('root:root') || lower.includes('root:toor')) {
      throw new Error('Database Security Violation: Default credentials detected in database connection string.');
    }
  }

  // Ensure file permissions on data directory
  try {
    fs.chmodSync(dataDir, 0o700);
  } catch (_) {
    // Windows file systems ignore octal permissions gracefully
  }

  console.log('🌿 Secure persistent database storage active (in-process, zero open network ports).');
};
