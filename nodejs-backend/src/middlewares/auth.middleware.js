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

    // If token is not provided, allow anonymous local usage
    if (!token) {
      req.authUser = {
        userId: 'local-user',
        email: 'local@localhost'
      };
      return next();
    }

    // Verify token if provided
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    );

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      // Fall back to local user if token references missing user
      req.authUser = {
        userId: 'local-user',
        email: 'local@localhost'
      };
      return next();
    }

    // Attach user to request
    req.authUser = {
      userId: user._id,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    // On any token error, fall back to local user (no hard 401)
    req.authUser = {
      userId: 'local-user',
      email: 'local@localhost'
    };
    next();
  }
};

module.exports = {
  authenticate
};

