const Quiz = require('../models/Quiz.model');
const ContentInput = require('../models/ContentInput.model');
const axios = require('axios');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * Map difficulty from API format to Quiz model format
 */
const mapDifficulty = (difficulty) => {
  const mapping = {
    'easy': 'Easy',
    'medium': 'Normal',
    'hard': 'Hard'
  };
  return mapping[difficulty] || 'Normal';
};

/**
 * POST /api/quiz-generation/generate-from-url
 * Generate quiz from URL/Selected Topics
 */
const generateQuizFromUrlHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { url, selectedTopics, difficulty, numberOfQuestions, timeDuration } = req.body;

    // Validate required fields
    if (!difficulty || !numberOfQuestions) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Difficulty and numberOfQuestions are required'
      });
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Difficulty must be easy, medium, or hard'
      });
    }

    // Validate numberOfQuestions
    if (typeof numberOfQuestions !== 'number' || numberOfQuestions < 1 || numberOfQuestions > 100) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Number of questions must be between 1 and 100'
      });
    }

    // Validate timeDuration
    const finalTimeDuration = timeDuration || 3600;
    if (finalTimeDuration < 60 || finalTimeDuration > 7200) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Time duration must be between 60 and 7200 seconds'
      });
    }

    // Validate URL or selectedTopics
    if (!url && (!selectedTopics || selectedTopics.length === 0)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Either URL or selectedTopics must be provided'
      });
    }

    // Validate selectedTopics if provided
    if (selectedTopics && selectedTopics.length > 0) {
      for (const topic of selectedTopics) {
        if (!topic.id || !topic.title || !topic.url) {
          return res.status(400).json({
            message: 'Invalid input',
            error: 'Each topic must have id, title, and url'
          });
        }
      }
    }

    // Create or find ContentInput if URL provided
    let contentInputId = null;
    if (url) {
      let contentInput = await ContentInput.findOne({
        userId: req.authUser.userId,
        type: 'url',
        source: url
      });

      if (!contentInput) {
        contentInput = await ContentInput.create({
          userId: req.authUser.userId,
          type: 'url',
          source: url,
          content: null
        });
      }
      contentInputId = contentInput.id;
    }

    // Call Python service
    try {
      const pythonResponse = await axios.post(
        `${PYTHON_SERVICE_URL}/api/ai/quiz/generate-from-url`,
        {
          url: url || undefined,
          selectedTopics: selectedTopics || undefined,
          difficulty,
          numberOfQuestions,
          userId: req.authUser.userId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': req.authUser.userId
          },
          timeout: 120000 // 120 seconds timeout
        }
      );

      if (!pythonResponse.data.success) {
        const errorData = pythonResponse.data.error || {};
        return res.status(500).json({
          message: errorData.message || 'Failed to generate quiz',
          error: errorData.details || errorData.message || 'Python service error: Quiz generation failed',
          code: errorData.code || 'QUIZ_GENERATION_FAILED',
          retryAfter: errorData.retryAfter
        });
      }

      const { questions, quizName, metadata } = pythonResponse.data.data;

      // Map questions difficulty
      const mappedQuestions = questions.map(q => ({
        ...q,
        difficulty: mapDifficulty(q.difficulty?.toLowerCase() || difficulty)
      }));

      // Create quiz
      const quiz = await Quiz.create({
        userId: req.authUser.userId,
        contentInputId,
        name: quizName || null,
        configuration: {
          difficulty: mapDifficulty(difficulty),
          numberOfQuestions: questions.length,
          timeDuration: finalTimeDuration
        },
        questions: mappedQuestions,
        answers: {},
        status: 'pending'
      });

      res.status(201).json({
        message: 'Quiz generated successfully',
        data: {
          quizId: quiz.id,
          questions: mappedQuestions,
          metadata: metadata || {}
        }
      });
    } catch (pythonError) {
      console.error('Python service error:', pythonError);
      
      if (pythonError.response) {
        // Python service returned an error response
        const errorData = pythonError.response.data;
        const statusCode = pythonError.response.status || 500;
        
        // Extract error information from Python service response
        if (errorData?.error) {
          // Python service returned structured error
          return res.status(statusCode).json({
            message: errorData.error.message || 'Failed to generate quiz',
            error: errorData.error.details || errorData.error.message || 'Python service error',
            code: errorData.error.code || 'QUIZ_GENERATION_FAILED',
            retryAfter: errorData.error.retryAfter
          });
        } else {
          // Fallback to generic error
          return res.status(statusCode).json({
            message: 'Failed to generate quiz',
            error: errorData?.message || pythonError.message || 'Python service error'
          });
        }
      } else if (pythonError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          message: 'Service unavailable',
          error: 'Python service is not available. Please try again later.',
          code: 'SERVICE_UNAVAILABLE'
        });
      } else if (pythonError.code === 'ETIMEDOUT') {
        return res.status(504).json({
          message: 'Request timeout',
          error: 'The request took too long to process. Please try again with fewer topics or shorter content.',
          code: 'TIMEOUT_ERROR'
        });
      } else {
        return res.status(500).json({
          message: 'Failed to generate quiz',
          error: pythonError.message || 'An unexpected error occurred',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  } catch (error) {
    console.error('Generate quiz from URL error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid input',
        error: Object.values(error.errors)[0]?.message || 'Validation failed'
      });
    }

    res.status(500).json({
      message: 'Failed to generate quiz',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/quiz-generation/generate-from-document
 * Generate quiz from document
 */
const generateQuizFromDocumentHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { document, difficulty, numberOfQuestions, timeDuration } = req.body;

    // Validate required fields
    if (!document || !difficulty || !numberOfQuestions) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Document, difficulty, and numberOfQuestions are required'
      });
    }

    // Validate document length
    if (typeof document !== 'string' || document.length < 10) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Document content must be at least 10 characters'
      });
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Difficulty must be easy, medium, or hard'
      });
    }

    // Validate numberOfQuestions
    if (typeof numberOfQuestions !== 'number' || numberOfQuestions < 1 || numberOfQuestions > 100) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Number of questions must be between 1 and 100'
      });
    }

    // Validate timeDuration
    const finalTimeDuration = timeDuration || 3600;
    if (finalTimeDuration < 60 || finalTimeDuration > 7200) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Time duration must be between 60 and 7200 seconds'
      });
    }

    // Create ContentInput
    const contentInput = await ContentInput.create({
      userId: req.authUser.userId,
      type: 'file',
      source: 'uploaded-document',
      content: document
    });

    // Call Python service
    try {
      const pythonResponse = await axios.post(
        `${PYTHON_SERVICE_URL}/api/ai/quiz/generate-from-document`,
        {
          document,
          difficulty,
          numberOfQuestions,
          userId: req.authUser.userId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': req.authUser.userId
          },
          timeout: 120000 // 120 seconds timeout
        }
      );

      if (!pythonResponse.data.success) {
        const errorData = pythonResponse.data.error || {};
        return res.status(500).json({
          message: errorData.message || 'Failed to generate quiz',
          error: errorData.details || errorData.message || 'Python service error: Quiz generation failed',
          code: errorData.code || 'QUIZ_GENERATION_FAILED',
          retryAfter: errorData.retryAfter
        });
      }

      const { questions, quizName, metadata } = pythonResponse.data.data;

      // Map questions difficulty
      const mappedQuestions = questions.map(q => ({
        ...q,
        difficulty: mapDifficulty(q.difficulty?.toLowerCase() || difficulty)
      }));

      // Create quiz
      const quiz = await Quiz.create({
        userId: req.authUser.userId,
        contentInputId: contentInput.id,
        name: quizName || null,
        configuration: {
          difficulty: mapDifficulty(difficulty),
          numberOfQuestions: questions.length,
          timeDuration: finalTimeDuration
        },
        questions: mappedQuestions,
        answers: {},
        status: 'pending'
      });

      res.status(201).json({
        message: 'Quiz generated successfully',
        data: {
          quizId: quiz.id,
          questions: mappedQuestions,
          metadata: metadata || {}
        }
      });
    } catch (pythonError) {
      console.error('Python service error:', pythonError);
      
      if (pythonError.response) {
        // Python service returned an error response
        const errorData = pythonError.response.data;
        const statusCode = pythonError.response.status || 500;
        
        // Extract error information from Python service response
        if (errorData?.error) {
          // Python service returned structured error
          return res.status(statusCode).json({
            message: errorData.error.message || 'Failed to generate quiz',
            error: errorData.error.details || errorData.error.message || 'Python service error',
            code: errorData.error.code || 'QUIZ_GENERATION_FAILED',
            retryAfter: errorData.error.retryAfter
          });
        } else {
          // Fallback to generic error
          return res.status(statusCode).json({
            message: 'Failed to generate quiz',
            error: errorData?.message || pythonError.message || 'Python service error'
          });
        }
      } else if (pythonError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          message: 'Service unavailable',
          error: 'Python service is not available. Please try again later.',
          code: 'SERVICE_UNAVAILABLE'
        });
      } else if (pythonError.code === 'ETIMEDOUT') {
        return res.status(504).json({
          message: 'Request timeout',
          error: 'The request took too long to process. Please try again with fewer topics or shorter content.',
          code: 'TIMEOUT_ERROR'
        });
      } else {
        return res.status(500).json({
          message: 'Failed to generate quiz',
          error: pythonError.message || 'An unexpected error occurred',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  } catch (error) {
    console.error('Generate quiz from document error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid input',
        error: Object.values(error.errors)[0]?.message || 'Validation failed'
      });
    }

    res.status(500).json({
      message: 'Failed to generate quiz',
      error: 'Internal server error'
    });
  }
};

module.exports = {
  generateQuizFromUrlHandler,
  generateQuizFromDocumentHandler
};

