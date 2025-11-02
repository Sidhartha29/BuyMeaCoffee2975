import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import connectDB from './connection.js';
import { Profile, Image, Transaction, DownloadToken } from './models.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.NETLIFY_DOMAIN || 'https://buymeacoffee297518.netlify.app', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://buymeacoffee297518.netlify.app']
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Connect to database
connectDB();

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Routes

// Upload image endpoint
app.post('/api/upload', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { image, thumbnail } = req.files;

    if (!image || !thumbnail) {
      return res.status(400).json({ error: 'Both image and thumbnail are required' });
    }

    const imagePublicId = `images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const thumbnailPublicId = `thumbnails/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const [imageResult, thumbnailResult] = await Promise.all([
      uploadToCloudinary(image[0].buffer, 'images', imagePublicId),
      uploadToCloudinary(thumbnail[0].buffer, 'thumbnails', thumbnailPublicId),
    ]);

    res.json({
      image_url: imageResult.secure_url,
      thumbnail_url: thumbnailResult.secure_url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Get all profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile by ID
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ id: req.params.id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create profile
app.post('/api/profiles', async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update profile
app.put('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all images
app.get('/api/images', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const images = await Image.find()
      .populate('creator_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Image.countDocuments();

    res.json({
      images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get image by ID
app.get('/api/images/:id', async (req, res) => {
  try {
    const image = await Image.findOne({ id: req.params.id });
    if (!image) return res.status(404).json({ error: 'Image not found' });
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get images by creator
app.get('/api/images/creator/:creatorId', async (req, res) => {
  try {
    const images = await Image.find({ creator_id: req.params.creatorId }).populate('creator_id');
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create image
app.post('/api/images', async (req, res) => {
  try {
    const image = new Image(req.body);
    await image.save();
    res.status(201).json(image);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update image
app.put('/api/images/:id', async (req, res) => {
  try {
    const image = await Image.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!image) return res.status(404).json({ error: 'Image not found' });
    res.json(image);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete image
app.delete('/api/images/:id', async (req, res) => {
  try {
    const image = await Image.findOneAndDelete({ id: req.params.id });
    if (!image) return res.status(404).json({ error: 'Image not found' });
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transactions by buyer
app.get('/api/transactions/buyer/:buyerId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ buyer_id: req.params.buyerId });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transactions by creator
app.get('/api/transactions/creator/:creatorId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ creator_id: req.params.creatorId });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();

    // Update creator's wallet balance
    const creator = await Profile.findOne({ id: req.body.creator_id });
    if (creator) {
      creator.wallet_balance += req.body.amount;
      await creator.save();
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get download tokens by buyer
app.get('/api/download-tokens/buyer/:buyerId', async (req, res) => {
  try {
    const tokens = await DownloadToken.find({ buyer_id: req.params.buyerId });
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate download token
app.get('/api/download-tokens/validate/:token', async (req, res) => {
  try {
    const token = await DownloadToken.findOne({ token: req.params.token });
    if (!token) return res.status(404).json({ error: 'Token not found' });

    if (token.used) return res.status(400).json({ error: 'Token already used' });
    if (token.expires_at < new Date()) return res.status(400).json({ error: 'Token expired' });

    res.json({ valid: true, image_id: token.image_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create download token
app.post('/api/download-tokens', async (req, res) => {
  try {
    const token = new DownloadToken(req.body);
    await token.save();
    res.status(201).json(token);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark token as used
app.put('/api/download-tokens/use/:token', async (req, res) => {
  try {
    const token = await DownloadToken.findOneAndUpdate(
      { token: req.params.token },
      { used: true },
      { new: true }
    );
    if (!token) return res.status(404).json({ error: 'Token not found' });
    res.json(token);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export for Netlify functions
export default app;

// Start server (only for local development)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
