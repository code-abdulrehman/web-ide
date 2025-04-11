import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/index.js';
import { CodeSnippet } from '../code-store/index.js';
import connectDB from './connection.js';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check if MONGODB_URI is defined
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  console.error('Please ensure your .env file contains a valid MONGODB_URI');
  process.exit(1);
}

// Sample data
const users = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'password123' // In a real app, hash this
  },
  {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123' // In a real app, hash this
  }
];

const codeSnippets = [
  {
    title: 'Hello World in JavaScript',
    content: 'console.log("Hello, World!");',
    language: 'javascript',
    isPublic: true
  },
  {
    title: 'Hello World in Python',
    content: 'print("Hello, World!")',
    language: 'python',
    isPublic: true
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    // Connect directly with mongoose instead of using connectDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await CodeSnippet.deleteMany({});
    
    console.log('Database cleared');
    
    // Insert users
    const createdUsers = await User.create(users);
    console.log(`${createdUsers.length} users created`);
    
    // Add owner reference to code snippets
    const codeSnippetsWithOwner = codeSnippets.map(snippet => ({
      ...snippet,
      owner: createdUsers[0]._id // Assign to first user (admin)
    }));
    
    // Insert code snippets
    const createdSnippets = await CodeSnippet.create(codeSnippetsWithOwner);
    console.log(`${createdSnippets.length} code snippets created`);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
