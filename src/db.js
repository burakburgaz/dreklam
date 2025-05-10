const mongoose = require('mongoose');

/**
 * Try to connect with multiple possible configurations
 */
const connectWithRetry = async () => {
  const connectionOptions = [
    { uri: 'mongodb://127.0.0.1:27017/healthcare-portal', options: { family: 4 } },
    { uri: 'mongodb://localhost:27017/healthcare-portal', options: { family: 4 } },
    { uri: 'mongodb://127.0.0.1:27017/healthcare-portal', options: { family: 0 } },
    { uri: 'mongodb://localhost:27017/healthcare-portal', options: { family: 0 } }
  ];

  for (let config of connectionOptions) {
    try {
      console.log(`Trying MongoDB connection with URI: ${config.uri}...`);
      const conn = await mongoose.connect(config.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Short timeout for fast failure detection
        ...config.options
      });
      
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.log(`Connection attempt failed: ${error.message}`);
    }
  }
  
  throw new Error('All MongoDB connection attempts failed');
};

/**
 * Connect to MongoDB with retry
 */
const connectDB = async () => {
  try {
    return await connectWithRetry();
  } catch (error) {
    console.error(`All MongoDB connection attempts failed: ${error.message}`);
    
    // Final attempt with longer timeout
    try {
      console.log('Making final connection attempt with extended timeout...');
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/healthcare-portal', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4
      });
      
      console.log(`MongoDB Connected on final attempt: ${conn.connection.host}`);
      return conn;
    } catch (finalError) {
      console.error(`Final MongoDB connection attempt failed: ${finalError.message}`);
      return null;
    }
  }
};

/**
 * Initialize database with required collections and indexes
 */
const initializeDB = async () => {
  try {
    // Check if connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected. Attempting to connect...');
      await connectDB();
    }
    
    // Create indexes for Facility collection if needed
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      
      // Get list of collections
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      // Create indexes for facility collection
      if (collectionNames.includes('facilities')) {
        console.log('Creating indexes for facilities collection...');
        
        // Create unique index on applicationId
        await db.collection('facilities').createIndex({ applicationId: 1 }, { unique: true });
        
        // Create index on status for fast filtering
        await db.collection('facilities').createIndex({ status: 1 });
        
        // Create index on creation date
        await db.collection('facilities').createIndex({ createdAt: -1 });
        
        console.log('Indexes created successfully');
      } else {
        console.log('Facilities collection does not exist yet. It will be created when first facility is added.');
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    return false;
  }
};

module.exports = {
  connectDB,
  initializeDB
}; 