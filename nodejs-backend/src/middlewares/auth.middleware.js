const User = require('../models/User.model');

/**
 * Authentication middleware
 * No-op authentication: ensures a local user exists and attaches it
 */
const authenticate = async (req, res, next) => {
  try {
    // Check if local-user exists, create if not
    let localUser = await User.findById('local-user');
    
    if (!localUser) {
      localUser = await User.create({
        id: 'local-user',
        themePreference: null
      });
    }
    
    req.authUser = {
      userId: localUser.id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    // Fallback to local-user even if database fails
    req.authUser = {
      userId: 'local-user'
    };
    next();
  }
};

module.exports = {
  authenticate
};

