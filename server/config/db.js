import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Ensure public DNS resolver is available for Node.js SRV records on macOS/Linux
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if running in restricted environment
}

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_study_assistant';

    // Set connection options
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`\n❌ [MongoDB] Connection error: ${error.message}`);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.warn(`
👉 [Troubleshooting MongoDB Atlas Connection]:
  1. Check your Cluster URL in 'server/.env' -> It must match your MongoDB Atlas cluster exactly.
     (In Atlas: Click 'Connect' -> 'Drivers' -> Copy the mongodb+srv:// connection string).
  2. Whitelist your IP in MongoDB Atlas:
     (Atlas Dashboard -> Network Access -> Add IP Address -> 'Allow Access from Anywhere' or 0.0.0.0/0).
  3. Ensure your database username and password in the URI are correct (e.g. no unencoded special characters in password).
  4. If running locally without Atlas, you can use: MONGODB_URI=mongodb://127.0.0.1:27017/ai_study_assistant
`);
    } else {
      console.warn(`[MongoDB] Running without persistent DB connection. Ensure MONGODB_URI in .env is valid.`);
    }
    return null;
  }
};

export default connectDB;
