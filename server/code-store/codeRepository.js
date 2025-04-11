import mongoose from 'mongoose';

// Define schema for code snippets
const codeSnippetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Code content is required']
  },
  language: {
    type: String,
    required: [true, 'Programming language is required'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const CodeSnippet = mongoose.model('CodeSnippet', codeSnippetSchema);

export default CodeSnippet;
