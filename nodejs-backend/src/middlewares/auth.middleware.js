const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Authentication middleware
 * Extracts JWT token from cookie or Authorization header
 * Verifies token and attaches user to req.authUser
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Try to get token from cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Try to get token from Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    );

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    // Attach user to request
    req.authUser = {
      userId: user._id,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    res.status(500).json({
      message: 'Authentication failed',
      error: 'Internal server error'
    });
  }
};

module.exports = {
  authenticate
};

