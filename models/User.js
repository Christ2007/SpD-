const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  hoursBalance: {
    type: Number,
    default: 0  // stored in quarter-hours
  },
  displayName: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
