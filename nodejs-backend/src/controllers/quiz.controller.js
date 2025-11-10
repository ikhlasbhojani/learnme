const Quiz = require('../models/Quiz.model');
const ContentInput = require('../models/ContentInput.model');
const axios = require('axios');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * Check if user owns the quiz
 */
const checkQuizOwnership = (quiz, userId) => {
  return quiz.userId === userId;
};

/**
 * Calculate quiz score
 */
const calculateScore = (quiz) => {
  let correctCount = 0;
  let incorrectCount = 0;
  const answers = quiz.answers instanceof Map ? Object.fromEntries(quiz.answers) : quiz.answers;

  quiz.questions.forEach(question => {
    const userAnswer = answers[question.id];
    if (userAnswer) {
      if (userAnswer === question.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  });

  const totalQuestions = quiz.questions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return { score, correctCount, incorrectCount };
};

/**
 * GET /api/quizzes
 * List quizzes
 */
const listQuizzesHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const quizzes = await Quiz.find({ userId: req.authUser.userId });

    res.status(200).json({
      data: quizzes.map(quiz => quiz.toJSON())
    });
  } catch (error) {
    console.error('List quizzes error:', error);
    res.status(500).json({
      message: 'Failed to retrieve quizzes',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/quizzes
 * Create quiz (manual)
 */
const createQuizHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { configuration, contentInputId } = req.body;

    // Validate configuration
    if (!configuration) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Configuration is required'
      });
    }

    const { difficulty, numberOfQuestions, timeDuration } = configuration;

    if (!difficulty || !numberOfQuestions || !timeDuration) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Configuration must include difficulty, numberOfQuestions, and timeDuration'
      });
    }

    if (!['Easy', 'Normal', 'Hard', 'Master'].includes(difficulty)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Difficulty must be Easy, Normal, Hard, or Master'
      });
    }

    if (typeof numberOfQuestions !== 'number' || numberOfQuestions < 1 || numberOfQuestions > 50) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Number of questions must be between 1 and 50'
      });
    }

    if (typeof timeDuration !== 'number' || timeDuration < 60 || timeDuration > 7200) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Time duration must be between 60 and 7200 seconds'
      });
    }

    // Validate contentInputId if provided
    if (contentInputId) {
      const contentInput = await ContentInput.findById(contentInputId);
      if (!contentInput) {
        return res.status(404).json({
          message: 'Content not found',
          error: 'Content input with this ID does not exist'
        });
      }
      if (contentInput.userId !== req.authUser.userId) {
        return res.status(403).json({
          message: 'Access denied',
          error: 'You are not allowed to use this content input'
        });
      }
    }

    const quiz = await Quiz.create({
      userId: req.authUser.userId,
      contentInputId: contentInputId || null,
      name: null,
      configuration: {
        difficulty,
        numberOfQuestions,
        timeDuration
      },
      questions: [],
      answers: {},
      status: 'pending'
    });

    res.status(201).json({
      message: 'Quiz created',
      data: quiz.toJSON()
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid input',
        error: Object.values(error.errors)[0]?.message || 'Validation failed'
      });
    }

    res.status(500).json({
      message: 'Failed to create quiz',
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/quizzes/:id
 * Get quiz by ID
 */
const getQuizHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
        error: 'Quiz with this ID does not exist'
      });
    }

    if (!checkQuizOwnership(quiz, req.authUser.userId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to access this quiz'
      });
    }

    res.status(200).json({
      data: quiz.toJSON()
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      message: 'Failed to retrieve quiz',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/quizzes/:id/start
 * Start quiz
 */
const startQuizHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
        error: 'Quiz with this ID does not exist'
      });
    }

    if (!checkQuizOwnership(quiz, req.authUser.userId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to access this quiz'
      });
    }

    if (quiz.status === 'in-progress') {
      return res.status(400).json({
        message: 'Quiz already started',
        error: 'Quiz is already in progress'
      });
    }

    if (quiz.status === 'completed' || quiz.status === 'expired') {
      return res.status(400).json({
        message: 'Quiz already completed',
        error: 'Cannot start a completed quiz'
      });
    }

    quiz.status = 'in-progress';
    quiz.startTime = new Date();
    quiz.endTime = null;
    await quiz.save();

    res.status(200).json({
      data: {
        id: quiz.id,
        status: quiz.status,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        updatedAt: quiz.updatedAt
      }
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({
      message: 'Failed to start quiz',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/quizzes/:id/answer
 * Answer question
 */
const answerQuizHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'QuestionId and answer are required'
      });
    }

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
        error: 'Quiz with this ID does not exist'
      });
    }

    if (!checkQuizOwnership(quiz, req.authUser.userId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to access this quiz'
      });
    }

    if (quiz.status !== 'in-progress') {
      return res.status(400).json({
        message: 'Quiz not started',
        error: 'Quiz must be started before answering questions'
      });
    }

    // Validate question exists
    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(400).json({
        message: 'Invalid question',
        error: 'Question ID does not exist in this quiz'
      });
    }

    // Validate answer is one of the options
    if (!question.options.includes(answer)) {
      return res.status(400).json({
        message: 'Invalid answer',
        error: 'Answer must be one of the question options'
      });
    }

    // Update answers
    const answers = quiz.answers instanceof Map ? Object.fromEntries(quiz.answers) : quiz.answers;
    answers[questionId] = answer;
    quiz.answers = new Map(Object.entries(answers));
    await quiz.save();

    res.status(200).json({
      data: {
        id: quiz.id,
        answers: quiz.answers instanceof Map ? Object.fromEntries(quiz.answers) : quiz.answers,
        updatedAt: quiz.updatedAt
      }
    });
  } catch (error) {
    console.error('Answer quiz error:', error);
    res.status(500).json({
      message: 'Failed to save answer',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/quizzes/:id/pause
 * Pause quiz
 */
const pauseQuizHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
        error: 'Quiz with this ID does not exist'
      });
    }

    if (!checkQuizOwnership(quiz, req.authUser.userId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to access this quiz'
      });
    }

    if (quiz.status !== 'in-progress') {
      return res.status(400).json({
        message: 'Quiz not in progress',
        error: 'Quiz must be in progress to pause'
      });
    }

    const pauseReason = reason || 'tab-change';
    if (!['tab-change', 'manual'].includes(pauseReason)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Pause reason must be tab-change or manual'
      });
    }

    quiz.pauseReason = pauseReason;
    quiz.pausedAt = new Date();
    quiz.pauseCount = (quiz.pauseCount || 0) + 1;
    await quiz.save();

    res.status(200).json({
      data: {
        id: quiz.id,
        status: quiz.status,
        pauseReason: quiz.pauseReason,
        pausedAt: quiz.pausedAt,
        pauseCount: quiz.pauseCount,
        updatedAt: quiz.updatedAt
      }
    });
  } catch (error) {
    console.error('Pause quiz error:', error);
    res.status(500).json({
      message: 'Failed to pause quiz',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/quizzes/:id/resume
 * Resume quiz
 */
const resumeQuizHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
        error: 'Quiz with this ID does not exist'
      });
    }

    if (!checkQuizOwnership(quiz, req.authUser.userId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to access this quiz'
      });
    }

    if (quiz.status !== 'in-progress') {
      return res.status(400).json({
        message: 'Quiz not in progress',
        error: 'Quiz must be in progress to resume'
      });
    }

    quiz.pauseReason = null;
    quiz.pausedAt = null;
    await quiz.save();

    res.status(200).json({
      data: {
        id: quiz.id,
        status: quiz.status,
        pauseReason: quiz.pauseReason,
        pausedAt: quiz.pausedAt,
        updatedAt: quiz.updatedAt
      }
    });
  } catch (error) {
    console.error('Resume quiz error:', error);
    res.status(500).json({
      message: 'Failed to resume quiz',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/quizzes/:id/finish
 * Finish quiz
 */
const finishQuizHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
        error: 'Quiz with this ID does not exist'
      });
    }

    if (!checkQuizOwnership(quiz, req.authUser.userId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to access this quiz'
      });
    }

    if (quiz.status !== 'in-progress') {
      return res.status(400).json({
        message: 'Quiz not started',
        error: 'Quiz must be started before finishing'
      });
    }

    // Calculate score
    const { score, correctCount, incorrectCount } = calculateScore(quiz);

    // Update quiz
    quiz.status = 'completed';
    quiz.score = score;
    quiz.correctCount = correctCount;
    quiz.incorrectCount = incorrectCount;
    quiz.endTime = new Date();
    await quiz.save();

    // Get original content if available
    let originalContent = null;
    if (quiz.contentInputId) {
      const contentInput = await ContentInput.findById(quiz.contentInputId);
      if (contentInput) {
        originalContent = contentInput.content;
      }
    }

    // Call Python service for analysis
    try {
      const answers = quiz.answers instanceof Map ? Object.fromEntries(quiz.answers) : quiz.answers;
      
      const pythonResponse = await axios.post(
        `${PYTHON_SERVICE_URL}/api/ai/quiz/analyze`,
        {
          quiz: {
            id: quiz.id,
            questions: quiz.questions,
            configuration: quiz.configuration
          },
          answers,
          originalContent: originalContent || undefined,
          userId: req.authUser.userId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': req.authUser.userId
          },
          timeout: 60000 // 60 seconds timeout
        }
      );

      if (pythonResponse.data.success) {
        const analysis = pythonResponse.data.data;
        quiz.analysis = {
          performanceReview: analysis.performanceReview || null,
          weakAreas: analysis.weakAreas || [],
          suggestions: analysis.suggestions || [],
          strengths: analysis.strengths || [],
          improvementAreas: analysis.improvementAreas || [],
          detailedAnalysis: analysis.detailedAnalysis || null,
          topicsToReview: analysis.topicsToReview || [],
          analyzedAt: new Date()
        };
        await quiz.save();
      }
    } catch (pythonError) {
      console.error('Python analysis error:', pythonError);
      
      // Log error but continue - quiz can be finished without analysis
      // However, we should still try to save the quiz
      if (pythonError.response?.data?.error) {
        const errorData = pythonError.response.data.error;
        console.error('Analysis error details:', {
          code: errorData.code,
          message: errorData.message,
          details: errorData.details
        });
      }
      // Continue - quiz will be saved without analysis
    }

    res.status(200).json({
      data: quiz.toJSON()
    });
  } catch (error) {
    console.error('Finish quiz error:', error);
    res.status(500).json({
      message: 'Failed to finish quiz',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/quizzes/:id/expire
 * Expire quiz
 */
const expireQuizHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
        error: 'Quiz with this ID does not exist'
      });
    }

    if (!checkQuizOwnership(quiz, req.authUser.userId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to access this quiz'
      });
    }

    quiz.status = 'expired';
    quiz.endTime = new Date();
    await quiz.save();

    res.status(200).json({
      data: {
        id: quiz.id,
        status: quiz.status,
        endTime: quiz.endTime,
        updatedAt: quiz.updatedAt
      }
    });
  } catch (error) {
    console.error('Expire quiz error:', error);
    res.status(500).json({
      message: 'Failed to expire quiz',
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/quizzes/:id/assessment
 * Get quiz assessment
 */
const getQuizAssessmentHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
        error: 'Quiz with this ID does not exist'
      });
    }

    if (!checkQuizOwnership(quiz, req.authUser.userId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to access this quiz'
      });
    }

    if (quiz.status !== 'completed' && quiz.status !== 'expired') {
      return res.status(400).json({
        message: 'Quiz not completed',
        error: 'Quiz must be completed or expired before viewing assessment'
      });
    }

    const answers = quiz.answers instanceof Map ? Object.fromEntries(quiz.answers) : quiz.answers;
    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;

    const assessment = {
      score: quiz.score,
      correctCount: quiz.correctCount,
      incorrectCount: quiz.incorrectCount,
      unansweredCount,
      performanceReview: quiz.analysis?.performanceReview || null,
      weakAreas: quiz.analysis?.weakAreas || [],
      suggestions: quiz.analysis?.suggestions || [],
      strengths: quiz.analysis?.strengths || [],
      improvementAreas: quiz.analysis?.improvementAreas || [],
      detailedAnalysis: quiz.analysis?.detailedAnalysis || null,
      topicsToReview: quiz.analysis?.topicsToReview || []
    };

    res.status(200).json({
      data: assessment
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({
      message: 'Failed to retrieve assessment',
      error: 'Internal server error'
    });
  }
};

module.exports = {
  listQuizzesHandler,
  createQuizHandler,
  getQuizHandler,
  startQuizHandler,
  answerQuizHandler,
  pauseQuizHandler,
  resumeQuizHandler,
  finishQuizHandler,
  expireQuizHandler,
  getQuizAssessmentHandler
};

