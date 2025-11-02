import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Prevent multiple connections in serverless environments
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Use different connection options for production
    const options = process.env.NODE_ENV === 'production'
      ? {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      : {};

    await mongoose.connect(mongoURI, options);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error; // Re-throw to handle in serverless functions
  }
};

export default connectDB;
