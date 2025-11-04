import { Router } from 'express'
import {
  loginHandler,
  logoutHandler,
  meHandler,
  signupHandler,
  updateProfileHandler,
} from './auth.controller'
import { authenticate } from '../../middlewares/auth.middleware'

const router = Router()

router.post('/signup', signupHandler)
router.post('/login', loginHandler)
router.post('/logout', logoutHandler)
router.get('/me', authenticate, meHandler)
router.patch('/me', authenticate, updateProfileHandler)

export default router

