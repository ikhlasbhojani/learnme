import { Router } from 'express'
import { getSetupStatusHandler, updateAIConfigHandler } from './setup.controller'

const router = Router()

// Public routes - no authentication required for setup
router.get('/status', getSetupStatusHandler)
router.post('/config', updateAIConfigHandler)
// Legacy endpoint for backward compatibility
router.post('/api-key', updateAIConfigHandler)

export const setupRoutes = router

