const express = require('express');
const router = express.Router();
const {
  listQuizzesHandler,
  createQuizHandler,
  getQuizHandler,
  startQuizHandler,
  answerQuizHandler,
  pauseQuizHandler,
  resumeQuizHandler,
  finishQuizHandler,
  expireQuizHandler,
  getQuizAssessmentHandler
} = require('../controllers/quiz.controller');

// Quiz routes (no authentication required for open-source mode)
router.get('/', listQuizzesHandler);
router.post('/', createQuizHandler);
router.get('/:id', getQuizHandler);
router.post('/:id/start', startQuizHandler);
router.post('/:id/answer', answerQuizHandler);
router.post('/:id/pause', pauseQuizHandler);
router.post('/:id/resume', resumeQuizHandler);
router.post('/:id/finish', finishQuizHandler);
router.post('/:id/expire', expireQuizHandler);
router.get('/:id/assessment', getQuizAssessmentHandler);

module.exports = router;

