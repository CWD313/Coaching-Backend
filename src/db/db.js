import mongoose from 'mongoose';
import { config } from './config/config.js';

/**
 * Connect to MongoDB
 */
export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongo.uri);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('✗ MongoDB disconnection failed:', error.message);
  }
};
