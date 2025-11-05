import { Router } from 'express'
import { authRoutes } from './auth'
import { contentRoutes } from './content'
import { quizRoutes } from './quiz'
import { quizGenerationRoutes } from './quiz-generation'

const router = Router()

router.use('/auth', authRoutes)
router.use('/content-inputs', contentRoutes)
router.use('/quizzes', quizRoutes)
router.use('/quiz-generation', quizGenerationRoutes)

export default router

