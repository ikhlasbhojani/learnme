const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: function() {
      return `user-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'blue', 'green'],
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  _id: true,
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    }
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

