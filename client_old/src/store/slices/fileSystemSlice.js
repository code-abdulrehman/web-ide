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
      console.log('Reading file:', filePath);
      const response = await axios.get(`${API_URL}/api/files/read?path=${encodeURIComponent(filePath)}`);
      return { path: filePath, content: response.data.content };
    } catch (error) {
      // Handle axios error responses properly
      if (error.response) {
        // The request was made and the server responded with an error status
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        return rejectWithValue({ error: 'No response from server', details: 'Network error' });
      } else {
        // Something happened in setting up the request
        return rejectWithValue({ error: 'Request setup error', details: error.message });
      }
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
      console.log(`Attempting to create ${type} at path: ${path}`);
      const response = await axios.post(`${API_URL}/api/files/create`, { path, type });
      console.log('Create file/folder response:', response.data);
      return { ...response.data, type };
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      if (error.response) {
        // The request was made and the server responded with an error status
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        return rejectWithValue({ error: 'No response from server', details: 'Network error' });
      } else {
        // Something happened in setting up the request
        return rejectWithValue({ error: 'Request setup error', details: error.message });
      }
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

export const renameFile = createAsyncThunk(
  'fileSystem/renameFile',
  async ({ oldPath, newPath }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/files/rename`, { oldPath, newPath });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to rename file');
    }
  }
);

const initialState = {
  fileTree: null,
  openFiles: {},
  currentDirectory: '/',
  currentFile: null,  // Track the currently active file
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
    setCurrentFile: (state, action) => {
      const filePath = action.payload;
      state.currentFile = filePath;
      
      // If the file exists in openFiles, make sure it's marked as the current file
      // If not, but we have its path, create a placeholder that will trigger loading
      if (!state.openFiles[filePath]) {
        // Create a placeholder that will show loading in the editor
        state.openFiles[filePath] = {
          content: '// Loading file...',
          isDirty: false,
          isLoading: true,
          lastSaved: null
        };
      }
    },
    closeFile: (state, action) => {
      const filePath = action.payload;
      
      // Remove the file from open files list
      if (state.openFiles[filePath]) {
        delete state.openFiles[filePath];
      }
      
      // If this was the current file, set the current file to the last open file or null
      if (state.currentFile === filePath) {
        const openFileKeys = Object.keys(state.openFiles);
        state.currentFile = openFileKeys.length > 0 ? openFileKeys[openFileKeys.length - 1] : null;
      }
    }
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
      .addCase(readFile.pending, (state, action) => {
        // Set loading state just for this file, not the entire system
        const filePath = action.meta.arg;
        
        // Create or update entry for this file
        state.openFiles[filePath] = {
          ...(state.openFiles[filePath] || {}),
          isLoading: true,
          content: state.openFiles[filePath]?.content || '// Loading file...',
        };
        
        // Don't set overall status to loading
        // state.status = 'loading';
      })
      .addCase(readFile.fulfilled, (state, action) => {
        // state.status = 'succeeded';
        const { path, content } = action.payload;
        state.openFiles[path] = {
          content,
          isDirty: false,
          isLoading: false,
          lastSaved: new Date().toISOString(),
        };
        // Set as current file when successfully loaded
        state.currentFile = path;
      })
      .addCase(readFile.rejected, (state, action) => {
        // We failed to read a file, but the whole system isn't in a failed state
        // Don't set state.status = 'failed';
        
        // Store error properly so it can be displayed to the user
        const errorMessage = action.payload?.error || action.error?.message || 'Unknown error';
        // state.error = errorMessage;
        
        // If the file path is available in the meta, also add an entry to openFiles
        // with the error message so it can be displayed in the editor
        if (action.meta?.arg) {
          const path = action.meta.arg;
          state.openFiles[path] = {
            content: `// Error loading file: ${errorMessage}`,
            isDirty: false,
            isError: true,
            isLoading: false,
            lastSaved: null,
          };
          state.currentFile = path;
        }
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
      .addCase(createFile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createFile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Success message can be displayed if needed
        console.log(`Successfully created ${action.payload.type}: ${action.payload.path}`);
        // We'll refetch the file tree after creating a file
      })
      .addCase(createFile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { error: 'Unknown error occurred' };
        console.error('Failed to create file/folder:', state.error);
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
      })
      
      // Rename file/folder
      .addCase(renameFile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(renameFile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { oldPath, newPath } = action.payload;
        
        // If the renamed file was open, update the references
        if (state.openFiles[oldPath]) {
          // Copy content to the new path
          state.openFiles[newPath] = { ...state.openFiles[oldPath] };
          // Delete the old reference
          delete state.openFiles[oldPath];
          
          // Update current file if it was the renamed one
          if (state.currentFile === oldPath) {
            state.currentFile = newPath;
          }
        }
      })
      .addCase(renameFile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setCurrentDirectory, updateFileContent, markFileSaved, setCurrentFile, closeFile } = fileSystemSlice.actions;

export default fileSystemSlice.reducer; 