import { Router } from 'express'
import { getSetupStatusHandler, updateAIConfigHandler } from './setup.controller'
import { authenticate } from '../../middlewares/auth.middleware'

const router = Router()

// Protected routes - require authentication
router.get('/status', authenticate, getSetupStatusHandler)
router.post('/config', authenticate, updateAIConfigHandler)
// Legacy endpoint for backward compatibility
router.post('/api-key', authenticate, updateAIConfigHandler)

export const setupRoutes = router

