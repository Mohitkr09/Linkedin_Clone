// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // You don’t need any extra options — modern Mongoose handles it automatically
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
