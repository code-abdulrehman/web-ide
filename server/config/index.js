import dotenv from 'dotenv';
import initFirebase from './firebase/index.js';
import cloudinary from './cloudinary.js';

// Load environment variables
dotenv.config();

// Export configuration
export default {
  port: process.env.PORT || 4000,
  mongoURI: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  environment: process.env.NODE_ENV || 'development',
  firebase: initFirebase,
  cloudinary
};
