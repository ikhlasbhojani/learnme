const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
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
  getQuizAssessmentHandler,
  deleteQuizHandler
} = require('../controllers/quiz.controller');

// Apply auth middleware to all quiz routes (simplified local-user mode)
router.use(authenticate);

// Quiz routes
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
router.delete('/:id', deleteQuizHandler);

module.exports = router;

