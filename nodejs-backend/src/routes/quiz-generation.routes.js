const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {
  generateQuizFromUrlHandler,
  generateQuizFromDocumentHandler
} = require('../controllers/quiz-generation.controller');

// Apply auth middleware to all quiz generation routes (simplified local-user mode)
router.use(authenticate);

// Quiz generation routes
router.post('/generate-from-url', generateQuizFromUrlHandler);
router.post('/generate-from-document', generateQuizFromDocumentHandler);

module.exports = router;

