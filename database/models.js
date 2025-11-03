import mongoose from 'mongoose';

// Profile Schema
const profileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  bio: { type: String, default: '' },
  profile_pic: { type: String, default: '' },
  password: { type: String },  // Add password field
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Add indexes for Profile
profileSchema.index({ name: 1 });

// Image Schema
const imageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  creator_id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image_url: { type: String, required: true },
  thumbnail_url: { type: String, required: true },
    price: { type: Number, default: 0, required: true, min: 0 },
  downloads: { type: Number, default: 0, min: 0 },
  category: { type: String, default: 'general' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Add indexes for Image
imageSchema.index({ creator_id: 1 });
imageSchema.index({ category: 1 });
imageSchema.index({ price: 1 });
imageSchema.index({ created_at: -1 });

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  buyer_id: { type: String, required: true },
  creator_id: { type: String, required: true },
  image_id: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  stripe_payment_id: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Add indexes for Transaction
transactionSchema.index({ buyer_id: 1 });
transactionSchema.index({ creator_id: 1 });
transactionSchema.index({ created_at: -1 });

// Download Token Schema
const downloadTokenSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  transaction_id: { type: String, required: true },
  buyer_id: { type: String, required: true },
  image_id: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// Add indexes for DownloadToken
downloadTokenSchema.index({ buyer_id: 1 });
downloadTokenSchema.index({ expires_at: 1 });

// Create models
const Profile = mongoose.model('Profile', profileSchema);
const Image = mongoose.model('Image', imageSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const DownloadToken = mongoose.model('DownloadToken', downloadTokenSchema);

export {
  Profile,
  Image,
  Transaction,
  DownloadToken
};
