import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas using Mongoose
 * 
 * Environment Variables Required:
 * - MONGO_URI: MongoDB Atlas connection string
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('❌ MONGO_URI environment variable is not defined');
  }

  // Mongoose connection options
  const options = {
    // Timeout settings
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,

    // Connection pool
    maxPoolSize: 10,
    minPoolSize: 2,

    // Performance optimizations
    autoIndex: process.env.NODE_ENV !== 'production', // Don't auto-create indexes in production
    family: 4, // Force IPv4
  };

  try {
    const connection = await mongoose.connect(mongoUri, options);

    console.log(`📦 MongoDB connected to: ${connection.connection.host}`);
    console.log(`📂 Database: ${connection.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📦 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * Useful for testing and graceful shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('📦 MongoDB disconnected');
}
