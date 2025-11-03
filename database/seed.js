import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Profile, Image, Transaction, DownloadToken } from './models.js';
import connectDB from './connection.js';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const runWithRetries = async (fn, attempts = 5, name = 'operation') => {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`Attempt ${i} for ${name} failed:`, err && err.message ? err.message : err);
      if (i < attempts) {
        const backoff = 500 * Math.pow(2, i);
        console.log(`Waiting ${backoff}ms before retrying ${name}...`);
        await delay(backoff);
      }
    }
  }
  throw lastErr;
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Wait for mongoose to be connected
    const waitForConnection = async () => {
      const maxWait = 15000; // 15s
      const start = Date.now();
      while (mongoose.connection.readyState !== 1) {
        if (Date.now() - start > maxWait) {
          throw new Error('Timed out waiting for mongoose connection');
        }
        await delay(200);
      }
    };

    await waitForConnection();

    // Clear existing data with retries
    await runWithRetries(() => Profile.deleteMany({}), 5, 'Profile.deleteMany');
    await runWithRetries(() => Image.deleteMany({}), 5, 'Image.deleteMany');
    await runWithRetries(() => Transaction.deleteMany({}), 5, 'Transaction.deleteMany');
    await runWithRetries(() => DownloadToken.deleteMany({}), 5, 'DownloadToken.deleteMany');

    console.log('Existing data cleared');

    // Seed profiles
    const profiles = [
      {
        id: 'user-1',
        name: 'Sidhartha',
        bio: 'Creative photographer capturing moments',
        profile_pic: 'https://example.com/sidhartha.jpg',
        wallet_balance: 0.00,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-10-01'),
        password: 'sidhartha123' // Unique password for user-1
      },
      {
        id: 'user-2',
        name: 'Alice Johnson',
        bio: 'Nature photographer capturing the beauty of the world',
        profile_pic: 'https://example.com/alice.jpg',
        wallet_balance: 0.00,
        created_at: new Date('2024-02-20'),
        updated_at: new Date('2024-09-15'),
        password: 'alice456' // Unique password for user-2
      },
      {
        id: 'user-3',
        name: 'Bob Smith',
        bio: 'Street photographer and urban explorer',
        profile_pic: 'https://example.com/bob.jpg',
        wallet_balance: 75.50,
        created_at: new Date('2024-03-10'),
        updated_at: new Date('2024-10-05')
      },
      {
        id: 'user-4',
        name: 'Carol Davis',
        bio: 'Portrait photographer specializing in artistic shots',
        profile_pic: 'https://example.com/carol.jpg',
        wallet_balance: 200.00,
        created_at: new Date('2024-04-10'),
        updated_at: new Date('2024-10-05')
      }
    ];

    await runWithRetries(() => Profile.insertMany(profiles), 5, 'Profile.insertMany');
    console.log('Profiles seeded');

    // Seed images (using placeholder URLs - replace with actual Cloudinary URLs after setup)
    const images = [
      {
        id: 'img-1',
        creator_id: 'user-1',
        title: 'Sunset Over Mountains',
        description: 'A breathtaking sunset view from the Rocky Mountains',
  image_url: 'https://placehold.co/1200x800/FF6B35/FFFFFF?text=Sunset+Mountains',
  thumbnail_url: 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Sunset+Mountains',
        price: 15.99,
        downloads: 23,
        category: 'Nature',
        created_at: new Date('2024-01-20'),
        updated_at: new Date('2024-01-20')
      },
      {
        id: 'img-2',
        creator_id: 'user-1',
        title: 'Creative Abstract',
        description: 'Modern abstract art with vibrant colors',
  image_url: 'https://placehold.co/1200x800/4ECDC4/FFFFFF?text=Abstract+Art',
  thumbnail_url: 'https://placehold.co/400x300/4ECDC4/FFFFFF?text=Abstract+Art',
        price: 22.50,
        downloads: 15,
        category: 'Abstract',
        created_at: new Date('2024-02-10'),
        updated_at: new Date('2024-02-10')
      },
      {
        id: 'img-3',
        creator_id: 'user-1',
        title: 'City Architecture',
        description: 'Stunning modern architecture in downtown',
  image_url: 'https://placehold.co/1200x800/45B7D1/FFFFFF?text=City+Architecture',
  thumbnail_url: 'https://placehold.co/400x300/45B7D1/FFFFFF?text=City+Architecture',
        price: 18.99,
        downloads: 28,
        category: 'Architecture',
        created_at: new Date('2024-03-05'),
        updated_at: new Date('2024-03-05')
      },
      {
        id: 'img-4',
        creator_id: 'user-2',
        title: 'Urban Street Scene',
        description: 'Vibrant city life captured in downtown',
  image_url: 'https://placehold.co/1200x800/96CEB4/FFFFFF?text=Street+Scene',
  thumbnail_url: 'https://placehold.co/400x300/96CEB4/FFFFFF?text=Street+Scene',
        price: 12.50,
        downloads: 18,
        category: 'Street',
        created_at: new Date('2024-02-25'),
        updated_at: new Date('2024-02-25')
      },
      {
        id: 'img-5',
        creator_id: 'user-3',
        title: 'Portrait Study',
        description: 'Artistic portrait with dramatic lighting',
  image_url: 'https://placehold.co/1200x800/FECA57/FFFFFF?text=Portrait+Study',
  thumbnail_url: 'https://placehold.co/400x300/FECA57/FFFFFF?text=Portrait+Study',
        price: 25.00,
        downloads: 7,
        category: 'Portrait',
        created_at: new Date('2024-03-15'),
        updated_at: new Date('2024-03-15')
      },
      {
        id: 'img-6',
        creator_id: 'user-4',
        title: 'Forest Path',
        description: 'A serene path through an ancient forest',
  image_url: 'https://placehold.co/1200x800/FF9FF3/FFFFFF?text=Forest+Path',
  thumbnail_url: 'https://placehold.co/400x300/FF9FF3/FFFFFF?text=Forest+Path',
        price: 18.75,
        downloads: 31,
        category: 'Nature',
        created_at: new Date('2024-04-10'),
        updated_at: new Date('2024-04-10')
      }
    ];

    await runWithRetries(() => Image.insertMany(images), 5, 'Image.insertMany');
    console.log('Images seeded');

    // Seed transactions
    const transactions = [
      {
        id: 'txn-1',
        buyer_id: 'user-2',
        creator_id: 'user-1',
        image_id: 'img-1',
        amount: 15.99,
        status: 'completed',
        stripe_payment_id: 'pi_test_123456789',
        created_at: new Date('2024-05-01')
      },
      {
        id: 'txn-2',
        buyer_id: 'user-3',
        creator_id: 'user-2',
        image_id: 'img-2',
        amount: 12.50,
        status: 'completed',
        stripe_payment_id: 'pi_test_987654321',
        created_at: new Date('2024-05-15')
      }
    ];

    await runWithRetries(() => Transaction.insertMany(transactions), 5, 'Transaction.insertMany');
    console.log('Transactions seeded');

    // Seed download tokens
    const downloadTokens = [
      {
        id: 'token-1',
        transaction_id: 'txn-1',
        buyer_id: 'user-2',
        image_id: 'img-1',
        token: 'download_token_abc123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        used: false,
        created_at: new Date('2024-05-01')
      },
      {
        id: 'token-2',
        transaction_id: 'txn-2',
        buyer_id: 'user-3',
        image_id: 'img-2',
        token: 'download_token_def456',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        used: false,
        created_at: new Date('2024-05-15')
      }
    ];

    await runWithRetries(() => DownloadToken.insertMany(downloadTokens), 5, 'DownloadToken.insertMany');
    console.log('Download tokens seeded');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
