import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

// Async thunks for file operations
export const fetchFileTree = createAsyncThunk(
  'fileSystem/fetchFileTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/files`);
      console.log(response.data.tree, "response.data.tree");
      return response.data.tree; // Return only the tree part of the response
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to fetch file tree');
    }
  }
);

export const readFile = createAsyncThunk(
  'fileSystem/readFile',
  async (filePath, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/files/read?path=${encodeURIComponent(filePath)}`);
      return { path: filePath, content: response.data.content };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to read file');
    }
  }
);

export const saveFile = createAsyncThunk(
  'fileSystem/saveFile',
  async ({ path, content }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/files/save`, { path, content });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to save file');
    }
  }
);

export const createFile = createAsyncThunk(
  'fileSystem/createFile',
  async ({ path, type }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/files/create`, { path, type });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create file');
    }
  }
);

export const deleteFile = createAsyncThunk(
  'fileSystem/deleteFile',
  async (path, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/api/files/delete?path=${encodeURIComponent(path)}`);
      return { path, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete file');
    }
  }
);

const initialState = {
  fileTree: null,
  openFiles: {},
  currentDirectory: '/',
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fileSystemSlice = createSlice({
  name: 'fileSystem',
  initialState,
  reducers: {
    setCurrentDirectory: (state, action) => {
      state.currentDirectory = action.payload;
    },
    updateFileContent: (state, action) => {
      const { path, content } = action.payload;
      if (state.openFiles[path]) {
        state.openFiles[path].content = content;
        state.openFiles[path].isDirty = true;
      }
    },
    markFileSaved: (state, action) => {
      const path = action.payload;
      if (state.openFiles[path]) {
        state.openFiles[path].isDirty = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch file tree
      .addCase(fetchFileTree.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFileTree.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.fileTree = action.payload;
      })
      .addCase(fetchFileTree.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Read file
      .addCase(readFile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(readFile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { path, content } = action.payload;
        state.openFiles[path] = {
          content,
          isDirty: false,
          lastSaved: new Date().toISOString(),
        };
      })
      .addCase(readFile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Save file
      .addCase(saveFile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveFile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { path } = action.payload;
        if (state.openFiles[path]) {
          state.openFiles[path].isDirty = false;
          state.openFiles[path].lastSaved = new Date().toISOString();
        }
      })
      .addCase(saveFile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Create file/folder
      .addCase(createFile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // We'll refetch the file tree after creating a file
      })
      
      // Delete file/folder
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { path } = action.payload;
        // Remove the file from openFiles if it's open
        if (state.openFiles[path]) {
          delete state.openFiles[path];
        }
        // We'll refetch the file tree after deleting a file
      });
  },
});

export const { setCurrentDirectory, updateFileContent, markFileSaved } = fileSystemSlice.actions;

export default fileSystemSlice.reducer; 