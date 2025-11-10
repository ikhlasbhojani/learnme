const mongoose = require('mongoose');

const contentInputSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: function() {
      return `content-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  type: {
    type: String,
    required: [true, 'Content type is required'],
    enum: ['url', 'file', 'manual']
  },
  source: {
    type: String,
    required: [true, 'Source is required']
  },
  content: {
    type: String,
    default: null
  }
}, {
  _id: true,
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const ContentInput = mongoose.model('ContentInput', contentInputSchema);

module.exports = ContentInput;

