// Custom error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('Error:', err);
  
  // Default error status and message
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Authentication Error',
      details: 'Invalid or expired token'
    });
  }
  
  // Handle custom API errors
  if (err.isApiError) {
    return res.status(err.status).json({
      error: err.title,
      details: err.message
    });
  }
  
  // General error response
  res.status(status).json({
    error: 'Server Error',
    details: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : message
  });
};

export default errorHandler; 