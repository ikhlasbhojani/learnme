import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware'
import { AppError } from '../../utils/appError'
import {
  answerQuestionSchema,
  createQuizSchema,
  pauseQuizSchema,
} from './quiz.validation'
import {
  answerQuizQuestion,
  createQuiz,
  expireQuiz,
  finishQuiz,
  getQuizAssessment,
  getQuizById,
  listQuizzes,
  pauseQuiz,
  resumeQuiz,
  startQuiz,
} from './quiz.service'

function ensureAuth(req: AuthenticatedRequest) {
  if (!req.authUser) {
    throw new AppError('Authentication required', 401)
  }
}

export async function createQuizHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const parsed = createQuizSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400)
    }

    const quiz = await createQuiz(req.authUser!.id, parsed.data)
    res.status(201).json({
      message: 'Quiz created',
      data: quiz,
    })
  } catch (error) {
    next(error)
  }
}

export async function startQuizHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const quiz = await startQuiz(req.authUser!.id, req.params.id)
    res.status(200).json({ data: quiz })
  } catch (error) {
    next(error)
  }
}

export async function answerQuizHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const parsed = answerQuestionSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400)
    }

    const quiz = await answerQuizQuestion(req.authUser!.id, req.params.id, parsed.data)
    res.status(200).json({ data: quiz })
  } catch (error) {
    next(error)
  }
}

export async function pauseQuizHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const parsed = pauseQuizSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Invalid input', 400)
    }

    const quiz = await pauseQuiz(req.authUser!.id, req.params.id, parsed.data)
    res.status(200).json({ data: quiz })
  } catch (error) {
    next(error)
  }
}

export async function resumeQuizHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const quiz = await resumeQuiz(req.authUser!.id, req.params.id)
    res.status(200).json({ data: quiz })
  } catch (error) {
    next(error)
  }
}

export async function finishQuizHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const quiz = await finishQuiz(req.authUser!.id, req.params.id)
    res.status(200).json({ data: quiz })
  } catch (error) {
    next(error)
  }
}

export async function expireQuizHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const quiz = await expireQuiz(req.authUser!.id, req.params.id)
    res.status(200).json({ data: quiz })
  } catch (error) {
    next(error)
  }
}

export async function getQuizHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const quizId = req.params.id
    const userId = req.authUser!.id
    
    if (!quizId) {
      return next(new AppError('Quiz ID is required', 400))
    }
    
    const quiz = await getQuizById(userId, quizId)
    res.status(200).json({ data: quiz })
  } catch (error) {
    console.error('Error in getQuizHandler:', error)
    next(error)
  }
}

export async function listQuizzesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const quizzes = await listQuizzes(req.authUser!.id)
    res.status(200).json({ data: quizzes })
  } catch (error) {
    next(error)
  }
}

export async function getQuizAssessmentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    ensureAuth(req)
    const assessment = await getQuizAssessment(req.authUser!.id, req.params.id)
    res.status(200).json({ data: assessment })
  } catch (error) {
    next(error)
  }
}

