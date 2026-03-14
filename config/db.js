// This function connects our app to MongoDB using Mongoose.
// Mongoose is an ODM (Object Document Mapper) — it lets us
// work with MongoDB using JavaScript classes instead of raw queries.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // Exit the app if DB connection fails
  }
};

module.exports = connectDB;