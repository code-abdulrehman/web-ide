import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'dark',
  sidebarVisible: true,
  terminalVisible: true,
  activeTab: 'terminal',
  activeFiles: [],
  currentFile: null,
  sidebarWidth: 250,
  terminalHeight: 300,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarVisible = !state.sidebarVisible;
    },
    toggleTerminal: (state) => {
      state.terminalVisible = !state.terminalVisible;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    openFile: (state, action) => {
      const fileToOpen = action.payload;
      // If the file is not already open, add it to activeFiles
      if (!state.activeFiles.some(file => file.path === fileToOpen.path)) {
        state.activeFiles.push(fileToOpen);
      }
      state.currentFile = fileToOpen.path;
    },
    closeFile: (state, action) => {
      const fileToClose = action.payload;
      state.activeFiles = state.activeFiles.filter(file => file.path !== fileToClose);
      
      // If we closed the current file, set currentFile to the last file in the activeFiles array or null
      if (state.currentFile === fileToClose) {
        state.currentFile = state.activeFiles.length > 0 
          ? state.activeFiles[state.activeFiles.length - 1].path 
          : null;
      }
    },
    setCurrentFile: (state, action) => {
      state.currentFile = action.payload;
    },
    setSidebarWidth: (state, action) => {
      state.sidebarWidth = action.payload;
    },
    setTerminalHeight: (state, action) => {
      state.terminalHeight = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  toggleTerminal,
  setActiveTab,
  openFile,
  closeFile,
  setCurrentFile,
  setSidebarWidth,
  setTerminalHeight,
} = uiSlice.actions;

export default uiSlice.reducer; 