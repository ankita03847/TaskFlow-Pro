const mongoose = require("mongoose");
const dns = require("dns");

// Configure DNS safely (helpful on Windows local networks; skip in serverless sandbox)
try {
  if (!process.env.VERCEL) {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  }
} catch (e) {
  // Ignore on serverless platforms
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    console.error("CRITICAL: MONGO_URI is not defined in environment variables!");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = conn.connections[0].readyState === 1;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Never call process.exit(1) on Vercel serverless, otherwise container crashes
  }
};

module.exports = connectDB;
