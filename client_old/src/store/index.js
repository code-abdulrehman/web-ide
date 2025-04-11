import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import fileSystemReducer from './slices/fileSystemSlice';
import uiReducer from './slices/uiSlice';
import { api } from '../services/api';

/**
 * Configure and export the Redux store
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    fileSystem: fileSystemReducer,
    ui: uiReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// Setup listeners for automatic refetching
setupListeners(store.dispatch);

// Export type of state for TypeScript support if needed later
export const RootState = store.getState;
export const AppDispatch = store.dispatch; 