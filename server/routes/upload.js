import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const uploadDir = path.resolve('public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();
  if (allowed.test(ext) && (mime.startsWith('image/') || allowed.test(mime))) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// POST /api/upload - Supports single or multiple image uploads
router.post('/', authenticate, authorize('owner', 'admin'), (req, res) => {
  upload.any()(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
    }

    const uploadedUrls = req.files.map(f => `/uploads/${f.filename}`);
    
    res.json({
      success: true,
      imageUrl: uploadedUrls[0],
      imageUrls: uploadedUrls,
      files: req.files.map(f => ({
        imageUrl: `/uploads/${f.filename}`,
        filename: f.filename,
        size: f.size
      }))
    });
  });
});

// POST /api/upload/multiple - Explicit endpoint for multiple images
router.post('/multiple', authenticate, authorize('owner', 'admin'), (req, res) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one image to upload' });
    }

    const imageUrls = req.files.map(f => `/uploads/${f.filename}`);
    res.json({
      success: true,
      imageUrls,
      imageUrl: imageUrls[0]
    });
  });
});

export default router;
