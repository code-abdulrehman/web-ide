// Rate limiter implementation
const rateLimit = (maxRequests, timeWindow) => {
  const requestCounts = {};
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Initialize or clean up old timestamps
    requestCounts[ip] = requestCounts[ip] || [];
    requestCounts[ip] = requestCounts[ip].filter(time => now - time < timeWindow);
    
    // Check if rate limit is exceeded
    if (requestCounts[ip].length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        message: 'Please try again later'
      });
    }
    
    // Add current request timestamp
    requestCounts[ip].push(now);
    next();
  };
};

export default rateLimit; 