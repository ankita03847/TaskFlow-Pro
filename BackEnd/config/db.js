const mongoose = require("mongoose");
const dns = require("dns");

// Configure DNS to prevent querySrv ECONNREFUSED issues on Windows/certain network providers
dns.setServers(["8.8.8.8", "8.8.4.4"]);
  
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
