const express = require('express');
const router = express.Router();
const {
  generateQuizFromUrlHandler,
  generateQuizFromDocumentHandler
} = require('../controllers/quiz-generation.controller');

// Quiz generation routes (no authentication required for open-source mode)
router.post('/generate-from-url', generateQuizFromUrlHandler);
router.post('/generate-from-document', generateQuizFromDocumentHandler);

module.exports = router;

