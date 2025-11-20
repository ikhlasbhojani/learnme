const User = require('../models/User.model');

/**
 * Ensure local user exists and optionally update theme preference
 */
const ensureLocalUser = async (themePreference) => {
  const user = await User.ensure('local-user');

  if (themePreference !== undefined) {
    user.themePreference = themePreference || null;
    await user.save();
  }

  return user;
};

/**
 * POST /api/auth/signup
 * In local mode signup simply returns the local user
 */
const signupHandler = async (req, res, next) => {
  try {
    const { themePreference } = req.body;

    if (themePreference && !['light', 'dark', 'blue', 'green'].includes(themePreference)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Theme preference must be light, dark, blue, or green'
      });
    }

    const user = await ensureLocalUser(themePreference);

    res.status(200).json({
      message: 'Local mode enabled - authentication disabled',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      message: 'Signup failed',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/auth/login
 * User login controller
 */
const loginHandler = async (req, res, next) => {
  try {
    const { themePreference } = req.body;

    if (themePreference && !['light', 'dark', 'blue', 'green'].includes(themePreference)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Theme preference must be light, dark, blue, or green'
      });
    }

    const user = await ensureLocalUser(themePreference);

    res.status(200).json({
      message: 'Local mode enabled - authentication disabled',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/auth/logout
 * User logout controller
 */
const logoutHandler = (req, res) => {
  try {
    res.status(200).json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Logout failed',
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/auth/me
 * Get current user controller
 */
const meHandler = async (req, res, next) => {
  try {
    const userId = (req.authUser && req.authUser.userId) || 'local-user';
    const user = await User.ensure(userId);

    res.status(200).json({
      data: user.toJSON(true) // Include API key so it's restored to localStorage
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Failed to fetch user',
      error: 'Internal server error'
    });
  }
};

/**
 * PATCH /api/auth/me
 * Update user profile controller
 */
const updateProfileHandler = async (req, res, next) => {
  try {
    const { themePreference, aiProvider, aiApiKey, aiModel, aiBaseUrl } = req.body;

    // Validate theme preference
    if (themePreference && !['light', 'dark', 'blue', 'green'].includes(themePreference)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Theme preference must be light, dark, blue, or green'
      });
    }

    // Validate AI provider
    if (aiProvider && !['gemini', 'openai'].includes(aiProvider)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'AI provider must be gemini or openai'
      });
    }

    const userId = (req.authUser && req.authUser.userId) || 'local-user';
    const user = await User.ensure(userId);

    // Update theme preference if provided
    if (themePreference !== undefined) {
      user.themePreference = themePreference || null;
    }

    // Update AI configuration if provided
    if (aiProvider !== undefined) {
      user.aiProvider = aiProvider || null;
    }
    if (aiApiKey !== undefined) {
      user.aiApiKey = aiApiKey || null;
    }
    if (aiModel !== undefined) {
      user.aiModel = aiModel || null;
    }
    if (aiBaseUrl !== undefined) {
      user.aiBaseUrl = aiBaseUrl || null;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated',
      data: user.toJSON(true) // Include API key in response for settings page
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: 'Internal server error'
    });
  }
};

module.exports = {
  signupHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  updateProfileHandler
};

