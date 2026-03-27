const express = require('express');
const User = require('../models/User');
const HoursEntry = require('../models/HoursEntry');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/hours/log — log quarter hours
router.post('/log', verifyToken, async (req, res) => {
  try {
    const { quarters, description } = req.body;
    if (!quarters || quarters < 1 || !Number.isInteger(Number(quarters))) {
      return res.status(400).json({ error: 'Quarters must be a positive integer (1 = 15 min)' });
    }

    const entry = new HoursEntry({
      userId: req.user.id,
      username: req.user.username,
      quarters: Number(quarters),
      description: description || ''
    });
    await entry.save();

    // Update user balance
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { hoursBalance: Number(quarters) } },
      { new: true }
    );

    res.json({
      message: 'Hours logged successfully',
      entry,
      newBalance: user.hoursBalance
    });
  } catch (err) {
    console.error('Log hours error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hours/my — get own entries and balance
router.get('/my', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    const entries = await HoursEntry.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ balance: user.hoursBalance, entries });
  } catch (err) {
    console.error('Get hours error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
