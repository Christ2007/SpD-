const mongoose = require('mongoose');

const hoursEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  quarters: {
    type: Number,
    required: true,
    min: 1  // minimum 1 quarter = 0.25h
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('HoursEntry', hoursEntrySchema);
