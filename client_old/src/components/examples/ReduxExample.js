import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../../store/slices/uiSlice';
import { useGetFileTreeQuery } from '../../services/api';
import apiService from '../services/api';

/**
 * Example component demonstrating how to use Redux state and actions
 */
const ReduxExample = () => {
  const dispatch = useDispatch();
  
  // Get UI state from Redux
  const { theme, sidebarVisible, terminalVisible } = useSelector((state) => state.ui);
  
  // Get auth state from Redux
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // Use RTK Query hook to fetch data
  const { data, isLoading } = useGetFileTreeQuery();
  
  // Example effect
  useEffect(() => {
    console.log('Theme changed to:', theme);
  }, [theme]);
  
  useEffect(() => {
    apiService.get('/api/some-endpoint').then(response => {
      console.log(response.data);
    });
  }, []);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Redux Example</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">UI State:</h3>
        <div>Current Theme: {theme}</div>
        <div>Sidebar Visible: {sidebarVisible ? 'Yes' : 'No'}</div>
        <div>Terminal Visible: {terminalVisible ? 'Yes' : 'No'}</div>
        
        <button 
          onClick={() => dispatch(toggleTheme())}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Theme
        </button>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold">Auth State:</h3>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        {user && (
          <div>
            <div>User: {user.name}</div>
            <div>Email: {user.email}</div>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold">File Tree:</h3>
        {isLoading && <div>Loading...</div>}
        {data && (
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ReduxExample; 