const express = require('express');
const router = express.Router();
const {
  signupHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  updateProfileHandler
} = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public routes
router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);

// Protected routes
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, updateProfileHandler);

module.exports = router;

