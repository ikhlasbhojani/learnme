const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Attach authentication cookie to response
 */
const attachAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

/**
 * Generate JWT token
 */
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'default-secret-change-in-production',
    { expiresIn: '7d' }
  );
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must include at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must include at least one number' };
  }
  return { valid: true };
};

/**
 * POST /api/auth/signup
 * User signup controller
 */
const signupHandler = async (req, res, next) => {
  try {
    const { email, password, themePreference } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Email and password are required'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        message: 'Invalid input',
        error: passwordValidation.error
      });
    }

    // Validate theme preference
    if (themePreference && !['light', 'dark', 'blue', 'green'].includes(themePreference)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Theme preference must be light, dark, blue, or green'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already registered',
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      themePreference: themePreference || null
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.email);

    // Set cookie
    attachAuthCookie(res, token);

    // Return response
    res.status(201).json({
      message: 'Signup successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate email error
    if (error.code === 11000 || error.message.includes('duplicate')) {
      return res.status(400).json({
        message: 'Email already registered',
        error: 'User with this email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid input',
        error: Object.values(error.errors)[0]?.message || 'Validation failed'
      });
    }

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
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'Email or password is incorrect'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.email);

    // Set cookie
    attachAuthCookie(res, token);

    // Return response
    res.status(200).json({
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
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
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    res.status(200).json({
      message: 'Logged out successfully'
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
    // req.authUser will be set by authenticate middleware
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const user = await User.findById(req.authUser.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'User account does not exist'
      });
    }

    res.status(200).json({
      data: user.toJSON()
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
    // req.authUser will be set by authenticate middleware
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { themePreference } = req.body;

    // Validate theme preference
    if (themePreference && !['light', 'dark', 'blue', 'green'].includes(themePreference)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Theme preference must be light, dark, blue, or green'
      });
    }

    const user = await User.findById(req.authUser.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'User account does not exist'
      });
    }

    // Update theme preference if provided
    if (themePreference !== undefined) {
      user.themePreference = themePreference || null;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated',
      data: user.toJSON()
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

