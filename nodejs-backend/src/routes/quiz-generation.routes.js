const express = require('express');
const router = express.Router();
const {
  generateQuizFromUrlHandler,
  generateQuizFromDocumentHandler
} = require('../controllers/quiz-generation.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All quiz generation routes require authentication
router.use(authenticate);

// Quiz generation routes
router.post('/generate-from-url', generateQuizFromUrlHandler);
router.post('/generate-from-document', generateQuizFromDocumentHandler);

module.exports = router;

