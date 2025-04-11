import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

// Create an Axios instance with default configuration
export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:9000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Create an API service using RTK Query
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:9000',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // File API endpoints
    getFileTree: builder.query({
      query: () => '/api/files',
    }),
    getFile: builder.query({
      query: (path) => `/api/files/read?path=${encodeURIComponent(path)}`,
    }),
    saveFile: builder.mutation({
      query: ({ path, content }) => ({
        url: '/api/files/save',
        method: 'POST',
        body: { path, content },
      }),
    }),
    createFile: builder.mutation({
      query: ({ path, type }) => ({
        url: '/api/files/create',
        method: 'POST',
        body: { path, type },
      }),
    }),
    deleteFile: builder.mutation({
      query: (path) => ({
        url: `/api/files/delete?path=${encodeURIComponent(path)}`,
        method: 'DELETE',
      }),
    }),
    
    // Terminal API endpoints
    executeCommand: builder.mutation({
      query: (command) => ({
        url: '/api/terminal/execute',
        method: 'POST',
        body: { command },
      }),
    }),
    
    // User API endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/api/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getUserProfile: builder.query({
      query: () => '/api/auth/profile',
    }),
  }),
});

export const {
  useGetFileTreeQuery,
  useGetFileQuery,
  useSaveFileMutation,
  useCreateFileMutation,
  useDeleteFileMutation,
  useExecuteCommandMutation,
  useLoginMutation,
  useRegisterMutation,
  useGetUserProfileQuery,
} = api;

// Utility function for making HTTP requests without RTK Query
export const apiService = {
  get: (url, config = {}) => axiosInstance.get(url, config),
  post: (url, data, config = {}) => axiosInstance.post(url, data, config),
  put: (url, data, config = {}) => axiosInstance.put(url, data, config),
  delete: (url, config = {}) => axiosInstance.delete(url, config),
};

export default apiService; 