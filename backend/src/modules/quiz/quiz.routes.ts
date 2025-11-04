import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import {
  answerQuizHandler,
  createQuizHandler,
  expireQuizHandler,
  finishQuizHandler,
  getQuizAssessmentHandler,
  getQuizHandler,
  listQuizzesHandler,
  pauseQuizHandler,
  resumeQuizHandler,
  startQuizHandler,
} from './quiz.controller'

const router = Router()

router.use(authenticate)

router.get('/', listQuizzesHandler)
router.post('/', createQuizHandler)
router.get('/:id/assessment', getQuizAssessmentHandler)
router.post('/:id/start', startQuizHandler)
router.post('/:id/answer', answerQuizHandler)
router.post('/:id/pause', pauseQuizHandler)
router.post('/:id/resume', resumeQuizHandler)
router.post('/:id/finish', finishQuizHandler)
router.post('/:id/expire', expireQuizHandler)
router.get('/:id', getQuizHandler)

export default router

