const jwt = require('jsonwebtoken');

// Middleware to protect routes
const protect = (req, res, next) => {
  try {
    // Get token from header or cookies
    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      token = req.cookies?.authToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    // Verify JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured in environment');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is not valid', error: error.message });
  }
};

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = { protect, generateToken };
