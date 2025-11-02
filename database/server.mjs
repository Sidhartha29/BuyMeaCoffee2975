import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import connectDB from './connection.js';
import { Profile, Image, Transaction, DownloadToken } from './models.js';
import serverless from 'serverless-http';

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
    ? ['https://buymeacoffee297518.netlify.app']
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
app.get('/.netlify/functions/server', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Upload image endpoint
app.post('/.netlify/functions/server/upload', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Upload request received:', {
      files: req.files,
      contentType: req.headers['content-type']
    });

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { image, thumbnail } = req.files || {};

    if (!image || !thumbnail) {
      console.error('Missing required files:', { hasImage: !!image, hasThumbnail: !!thumbnail });
      return res.status(400).json({
        error: 'Both image and thumbnail are required',
        received: {
          image: !!image,
          thumbnail: !!thumbnail
        }
      });
    }

    console.log('Processing files:', {
      image: { size: image[0].size, mimetype: image[0].mimetype },
      thumbnail: { size: thumbnail[0].size, mimetype: thumbnail[0].mimetype }
    });

    const imagePublicId = `images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const thumbnailPublicId = `thumbnails/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const [imageResult, thumbnailResult] = await Promise.all([
      uploadToCloudinary(image[0].buffer, 'images', imagePublicId),
      uploadToCloudinary(thumbnail[0].buffer, 'thumbnails', thumbnailPublicId),
    ]);

    console.log('Upload successful:', {
      image: imageResult.secure_url,
      thumbnail: thumbnailResult.secure_url
    });

    res.json({
      image_url: imageResult.secure_url,
      thumbnail_url: thumbnailResult.secure_url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload images',
      details: error.message
    });
  }
});

// Get all profiles
app.get('/.netlify/functions/server/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile by ID
app.get('/.netlify/functions/server/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ id: req.params.id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create profile
app.post('/.netlify/functions/server/profiles', async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
app.put('/.netlify/functions/server/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export the serverless function
export const handler = serverless(app);

// Only start the server in development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}