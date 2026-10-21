import express from 'express';
import { Subscriber } from '../models/Misc.js';
import { sendInternalError } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const normalized = email.toLowerCase().trim();
    let sub = await Subscriber.findOne({ email: normalized });

    if (sub) {
      if (!sub.isActive) {
        sub.isActive = true;
        sub.unsubscribedAt = null;
        await sub.save();
      }
      return res.json({ success: true, message: 'You are already in the Aarkis Circle.' });
    }

    await Subscriber.create({ email: normalized, isActive: true });
    res.status(201).json({ success: true, message: 'Subscribed successfully. Welcome to the Aarkis Circle.' });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to process newsletter subscription.');
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    await Subscriber.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { isActive: false, unsubscribedAt: new Date() }
    );

    res.json({ success: true, message: 'You have been unsubscribed from promotional announcements.' });
  } catch (error) {
    return sendInternalError(res, error, 'Failed to process unsubscribe request.');
  }
});

export default router;
