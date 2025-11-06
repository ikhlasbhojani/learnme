import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import {
  createContentHandler,
  deleteContentHandler,
  getContentHandler,
  listContentHandler,
  updateContentHandler,
  extractTopicsHandler,
} from './content.controller'

const router = Router()

router.use(authenticate)

router.get('/', listContentHandler)
router.post('/', createContentHandler)
router.post('/extract-topics', extractTopicsHandler)
router.get('/:id', getContentHandler)
router.patch('/:id', updateContentHandler)
router.delete('/:id', deleteContentHandler)

export default router

