import { Router } from 'express'
import { authRoutes } from './auth'
import { contentRoutes } from './content'
import { quizRoutes } from './quiz'

const router = Router()

router.use('/auth', authRoutes)
router.use('/content-inputs', contentRoutes)
router.use('/quizzes', quizRoutes)

export default router

