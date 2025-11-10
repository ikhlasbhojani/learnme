const express = require('express');
const router = express.Router();
const {
  extractTopicsHandler,
  listContentHandler,
  createContentHandler,
  getContentHandler,
  updateContentHandler,
  deleteContentHandler
} = require('../controllers/content.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All content routes require authentication
router.use(authenticate);

// Content routes
router.get('/', listContentHandler);
router.post('/', createContentHandler);
router.post('/extract-topics', extractTopicsHandler);
router.get('/:id', getContentHandler);
router.patch('/:id', updateContentHandler);
router.delete('/:id', deleteContentHandler);

module.exports = router;

