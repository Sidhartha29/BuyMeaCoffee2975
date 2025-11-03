import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set in environment');
  process.exit(2);
}

const options = {
  // These options mirror the project's connection helper; some options
  // (useNewUrlParser/useUnifiedTopology) produce deprecation warnings but
  // are harmless for a quick connectivity check.
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

(async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(uri, options);
    console.log('Connected to MongoDB. Running ping...');

    const admin = mongoose.connection.db.admin();
    const ping = await admin.ping();
    console.log('Ping response:', ping);

    const stats = await mongoose.connection.db.stats();
    console.log('DB stats:', { db: stats.db, collections: stats.collections });

    await mongoose.disconnect();
    console.log('Disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('Mongo connectivity test failed:');
    console.error(err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
