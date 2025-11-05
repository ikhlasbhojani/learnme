import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import {
  generateQuizFromDocumentHandler,
  generateQuizFromUrlHandler,
} from './quiz-generation.controller'

const router = Router()

router.use(authenticate)

router.post('/generate-from-url', generateQuizFromUrlHandler)
router.post('/generate-from-document', generateQuizFromDocumentHandler)

export default router

