import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './themes/theme.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { store } from './store';

// Import the xterm CSS if you're using the terminal component
import 'xterm/css/xterm.css';

// Create a root
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

// Render app to root with Redux provider
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
