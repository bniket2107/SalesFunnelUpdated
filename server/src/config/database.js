const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      console.error('MONGODB_URI environment variable is not defined');
      console.error('Please create a .env file with MONGODB_URI');
      process.exit(1);
    }

    const options = {
      // Newer versions of Mongoose don't need these options
      // but keeping for compatibility
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(uri, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);

    // Provide helpful suggestions
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.error('\n📋 SSL/TLS Error Suggestions:');
      console.error('1. Check if your IP is whitelisted in MongoDB Atlas');
      console.error('2. Try adding ?tls=true to your connection string');
      console.error('3. For local development, consider using MongoDB locally');
      console.error('\nLocal MongoDB: mongodb://localhost:27017/growth-valley-crm');
    }

    process.exit(1);
  }
};

module.exports = connectDB;