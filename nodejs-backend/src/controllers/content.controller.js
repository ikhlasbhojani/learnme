const ContentInput = require('../models/ContentInput.model');
const axios = require('axios');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * POST /api/content/extract-topics
 * Extract topics from documentation (Proxy to Python)
 */
const extractTopicsHandler = async (req, res, next) => {
  try {
    // Log incoming request
    console.log('\n========================================');
    console.log('📥 [EXTRACT TOPICS REQUEST]');
    console.log('========================================');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('User ID:', req.authUser?.userId || 'Not authenticated');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('========================================\n');

    if (!req.authUser || !req.authUser.userId) {
      console.log('❌ Authentication failed - No user ID');
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { url } = req.body;

    // Validate URL
    if (!url) {
      console.log('❌ Validation failed - URL is missing');
      return res.status(400).json({
        message: 'Invalid URL format',
        error: 'URL is required'
      });
    }

    if (!isValidUrl(url)) {
      console.log('❌ Validation failed - Invalid URL format:', url);
      return res.status(400).json({
        message: 'Invalid URL format',
        error: 'URL must be a valid HTTP or HTTPS URL'
      });
    }

    console.log('✅ Validation passed');
    console.log('🔗 URL:', url);
    console.log('🐍 Calling Python service:', `${PYTHON_SERVICE_URL}/api/ai/content/extract-topics`);
    console.log('⏳ Waiting for Python service response...\n');

    // Call Python service
    try {
      const response = await axios.post(
        `${PYTHON_SERVICE_URL}/api/ai/content/extract-topics`,
        {
          url,
          userId: req.authUser.userId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': req.authUser.userId
          },
          timeout: 120000 // 120 seconds timeout (Python service can take time for topic extraction)
        }
      );

      console.log('✅ Python service responded successfully');
      console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
      console.log('========================================\n');

      if (response.data.success) {
        return res.status(200).json({
          message: 'Topics extracted successfully',
          data: response.data.data
        });
      } else {
        return res.status(500).json({
          message: 'Failed to extract topics',
          error: response.data.error?.message || 'Python service error'
        });
      }
    } catch (pythonError) {
      console.error('\n❌ Python service error occurred:');
      console.error('Error type:', pythonError.name);
      console.error('Error message:', pythonError.message);
      
      if (pythonError.response) {
        console.error('Response status:', pythonError.response.status);
        console.error('Response data:', JSON.stringify(pythonError.response.data, null, 2));
        console.log('========================================\n');
        
        // Python service returned an error response
        const errorData = pythonError.response.data;
        const statusCode = pythonError.response.status || 500;
        
        // Extract error information from Python service response
        if (errorData?.error) {
          // Python service returned structured error
          return res.status(statusCode).json({
            message: errorData.error.message || 'Failed to extract topics',
            error: errorData.error.details || errorData.error.message || 'Python service error',
            code: errorData.error.code || 'TOPIC_EXTRACTION_FAILED',
            retryAfter: errorData.error.retryAfter
          });
        } else {
          // Fallback to generic error
          return res.status(statusCode).json({
            message: 'Failed to extract topics',
            error: errorData?.message || pythonError.message || 'Python service error'
          });
        }
      } else if (pythonError.code === 'ECONNREFUSED') {
        console.error('❌ Connection refused - Python service is not running');
        console.log('========================================\n');
        return res.status(503).json({
          message: 'Service unavailable',
          error: 'Python service is not available. Please try again later.',
          code: 'SERVICE_UNAVAILABLE'
        });
      } else if (pythonError.code === 'ETIMEDOUT') {
        console.error('❌ Request timeout - Python service took too long');
        console.log('========================================\n');
        return res.status(504).json({
          message: 'Request timeout',
          error: 'The request took too long to process. Please try again with a smaller URL or fewer pages.',
          code: 'TIMEOUT_ERROR'
        });
      } else {
        console.error('❌ Unknown error:', pythonError);
        console.log('========================================\n');
        return res.status(500).json({
          message: 'Failed to extract topics',
          error: pythonError.message || 'An unexpected error occurred',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  } catch (error) {
    console.error('Extract topics error:', error);
    res.status(500).json({
      message: 'Failed to extract topics',
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/content
 * List content inputs
 */
const listContentHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const contentInputs = await ContentInput.find({ userId: req.authUser.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Content retrieved',
      data: contentInputs.map(item => item.toJSON())
    });
  } catch (error) {
    console.error('List content error:', error);
    res.status(500).json({
      message: 'Failed to retrieve content',
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/content
 * Create content input
 */
const createContentHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { type, source, content } = req.body;

    // Validate required fields
    if (!type || !source) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Type and source are required'
      });
    }

    // Validate type
    if (!['url', 'file', 'manual'].includes(type)) {
      return res.status(400).json({
        message: 'Invalid input',
        error: 'Type must be url, file, or manual'
      });
    }

    const contentInput = new ContentInput({
      userId: req.authUser.userId,
      type,
      source,
      content: content || null
    });

    await contentInput.save();

    res.status(201).json({
      message: 'Content created',
      data: contentInput.toJSON()
    });
  } catch (error) {
    console.error('Create content error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid input',
        error: Object.values(error.errors)[0]?.message || 'Validation failed'
      });
    }

    res.status(500).json({
      message: 'Failed to create content',
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/content/:id
 * Get content input by ID
 */
const getContentHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;

    const contentInput = await ContentInput.findById(id);

    if (!contentInput) {
      return res.status(404).json({
        message: 'Content not found',
        error: 'Content input with this ID does not exist'
      });
    }

    // Check ownership
    if (contentInput.userId !== req.authUser.userId) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to access this content'
      });
    }

    res.status(200).json({
      message: 'Content retrieved',
      data: contentInput.toJSON()
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      message: 'Failed to retrieve content',
      error: 'Internal server error'
    });
  }
};

/**
 * PATCH /api/content/:id
 * Update content input
 */
const updateContentHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;
    const { source, content } = req.body;

    const contentInput = await ContentInput.findById(id);

    if (!contentInput) {
      return res.status(404).json({
        message: 'Content not found',
        error: 'Content input with this ID does not exist'
      });
    }

    // Check ownership
    if (contentInput.userId !== req.authUser.userId) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to update this content'
      });
    }

    // Update fields
    if (source !== undefined) {
      contentInput.source = source;
    }
    if (content !== undefined) {
      contentInput.content = content;
    }

    await contentInput.save();

    res.status(200).json({
      message: 'Content updated',
      data: contentInput.toJSON()
    });
  } catch (error) {
    console.error('Update content error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid input',
        error: Object.values(error.errors)[0]?.message || 'Validation failed'
      });
    }

    res.status(500).json({
      message: 'Failed to update content',
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/content/:id
 * Delete content input
 */
const deleteContentHandler = async (req, res, next) => {
  try {
    if (!req.authUser || !req.authUser.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'Invalid or expired token'
      });
    }

    const { id } = req.params;

    const contentInput = await ContentInput.findById(id);

    if (!contentInput) {
      return res.status(404).json({
        message: 'Content not found',
        error: 'Content input with this ID does not exist'
      });
    }

    // Check ownership
    if (contentInput.userId !== req.authUser.userId) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You are not allowed to delete this content'
      });
    }

    await ContentInput.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Content deleted',
      data: { id }
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      message: 'Failed to delete content',
      error: 'Internal server error'
    });
  }
};

module.exports = {
  extractTopicsHandler,
  listContentHandler,
  createContentHandler,
  getContentHandler,
  updateContentHandler,
  deleteContentHandler
};

