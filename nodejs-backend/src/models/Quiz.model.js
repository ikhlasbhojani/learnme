const mongoose = require('mongoose');

// Quiz Configuration Schema
const quizConfigurationSchema = new mongoose.Schema({
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Normal', 'Hard', 'Master']
  },
  numberOfQuestions: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  timeDuration: {
    type: Number,
    required: true,
    min: 60,
    max: 7200
  }
}, { _id: false });

// Quiz Question Schema
const quizQuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 4;
      },
      message: 'Options must have exactly 4 elements'
    }
  },
  correctAnswer: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Normal', 'Hard', 'Master']
  },
  explanation: {
    type: String,
    default: null
  },
  codeSnippet: {
    type: String,
    default: null
  },
  imageReference: {
    type: String,
    default: null
  }
}, { _id: false });

// Quiz Analysis Schema
const quizAnalysisSchema = new mongoose.Schema({
  performanceReview: {
    type: String,
    default: null
  },
  weakAreas: {
    type: [String],
    default: []
  },
  suggestions: {
    type: [String],
    default: []
  },
  strengths: {
    type: [String],
    default: []
  },
  improvementAreas: {
    type: [String],
    default: []
  },
  detailedAnalysis: {
    type: String,
    default: null
  },
  topicsToReview: {
    type: [String],
    default: []
  },
  analyzedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

// Main Quiz Schema
const quizSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: function() {
      return `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  contentInputId: {
    type: String,
    default: null,
    ref: 'ContentInput'
  },
  name: {
    type: String,
    default: null
  },
  configuration: {
    type: quizConfigurationSchema,
    required: true
  },
  questions: {
    type: [quizQuestionSchema],
    default: []
  },
  answers: {
    type: Map,
    of: String,
    default: {}
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'expired'],
    default: 'pending'
  },
  score: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  correctCount: {
    type: Number,
    default: null
  },
  incorrectCount: {
    type: Number,
    default: null
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  pauseReason: {
    type: String,
    enum: ['tab-change', 'manual'],
    default: null
  },
  pausedAt: {
    type: Date,
    default: null
  },
  pauseCount: {
    type: Number,
    default: 0
  },
  analysis: {
    type: quizAnalysisSchema,
    default: null
  }
}, {
  _id: true,
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      // Convert Map to Object for JSON
      if (ret.answers instanceof Map) {
        ret.answers = Object.fromEntries(ret.answers);
      }
      delete ret.__v;
      return ret;
    }
  }
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;

