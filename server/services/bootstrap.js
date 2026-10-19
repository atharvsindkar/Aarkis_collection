import bcrypt from 'bcryptjs';
import { usersDB } from '../config/db.js';

export const bootstrapOwner = async () => {
  try {
    const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || 'owner@aarkiscollection.com').toLowerCase().trim();
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'AarkisOwner@2026!';
    const name = process.env.ADMIN_BOOTSTRAP_NAME || 'Aarkis Owner';

    const existing = await usersDB.findOne({ role: 'owner' });
    if (!existing) {
      console.log(`👑 Bootstrapping initial owner: ${email}`);
      const hashedPassword = await bcrypt.hash(password, 12);
      await usersDB.insert({
        name,
        email,
        password: hashedPassword,
        role: 'owner',
        isActive: true,
        emailVerified: true,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Initial Owner account bootstrapped successfully!');
    } else {
      console.log(`👑 Owner account exists (${existing.email})`);
    }
  } catch (error) {
    console.error('⚠️ Bootstrap error:', error.message);
  }
};
