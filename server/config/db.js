import Datastore from 'nedb-promises';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve('server/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create persistent local datastores that use standard MongoDB query syntax
export const usersDB = Datastore.create({ filename: path.join(dataDir, 'users.db'), autoload: true });
export const productsDB = Datastore.create({ filename: path.join(dataDir, 'products.db'), autoload: true });
export const categoriesDB = Datastore.create({ filename: path.join(dataDir, 'categories.db'), autoload: true });
export const ordersDB = Datastore.create({ filename: path.join(dataDir, 'orders.db'), autoload: true });
export const couponsDB = Datastore.create({ filename: path.join(dataDir, 'coupons.db'), autoload: true });
export const subscribersDB = Datastore.create({ filename: path.join(dataDir, 'subscribers.db'), autoload: true });
export const auditLogsDB = Datastore.create({ filename: path.join(dataDir, 'audit_logs.db'), autoload: true });

export const connectDB = async () => {
  console.log('🌿 Persistent local MongoDB-compatible storage active in server/data/');
};
