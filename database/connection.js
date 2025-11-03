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
    const baseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const prodOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    };

    const options = process.env.NODE_ENV === 'production'
      ? { ...baseOptions, ...prodOptions }
      : baseOptions;

    // Retry loop with backoff to make the server more resilient to transient
    // network issues or startup ordering (e.g., DB starts after app).
    const maxAttempts = 5;
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        attempt += 1;
        await mongoose.connect(mongoURI, options);
        console.log('MongoDB connected successfully');
        return;
      } catch (err) {
        console.error(`MongoDB connection attempt ${attempt} failed:`, err.message || err);
        if (attempt >= maxAttempts) {
          console.error('MongoDB connection failed after max attempts. Continuing without DB connection.');
          // Don't throw here to avoid crashing serverless functions or the process.
          // Endpoints should check connection state and return appropriate errors.
          return;
        }
        // Exponential backoff before retrying
        const backoffMs = 1000 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  } catch (error) {
    // Fatal configuration problems (like missing URI) should still be logged.
    console.error('MongoDB initialisation error:', error);
    // Do not re-throw — keep process running so API can respond with JSON errors.
    return;
  }
};

export default connectDB;
