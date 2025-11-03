import mongoose from 'mongoose';

const connectDB = async () => {
  // Prevent multiple connections in serverless environments
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('MONGODB_URI environment variable is not set');
    return;
  }

  // Connection options for production and development
  const options = process.env.NODE_ENV === 'production'
    ? {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10
      }
    : {
        serverSelectionTimeoutMS: 5000
      };

  // Try to connect with retries
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(mongoURI, options);
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      console.error(`MongoDB Atlas connection attempt ${attempt} failed:`, err.message);
      
      // On last attempt, try local MongoDB in development
      if (attempt === maxAttempts) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('\nTo fix MongoDB connection:');
          console.log('1. Start local MongoDB:');
          console.log('   > mongod');
          console.log('2. OR set MONGODB_URI in .env:');
          console.log('   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<dbname>');
          console.log('3. For MongoDB Atlas:');
          console.log('   - Whitelist your IP: https://www.mongodb.com/docs/atlas/security-whitelist/');
          console.log('   - Check credentials and cluster status in Atlas dashboard\n');

          try {
            console.log('Attempting to connect to local MongoDB...');
            await mongoose.connect('mongodb://localhost:27017/buymeacoffee', {
              serverSelectionTimeoutMS: 5000
            });
            console.log('Connected to local MongoDB successfully');
            return;
          } catch (localError) {
            console.error('Local MongoDB connection failed:', localError.message);
          }
        }
        console.error('MongoDB connection failed after max attempts');
        return;
      }

      // Wait before next retry using exponential backoff
      const backoffMs = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
};

export default connectDB;
