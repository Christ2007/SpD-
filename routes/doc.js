const express = require('express');
const User = require('../models/User');
const HoursEntry = require('../models/HoursEntry');
const { verifyToken, requireDoc } = require('../middleware/auth');

const router = express.Router();

// GET /api/doc/users — list all users with balances (read-only, no delete)
router.get('/users', verifyToken, requireDoc, async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ username: 1 });
    const formatted = users.map(u => ({
      id: u._id,
      username: u.username,
      displayName: u.displayName || u.username,
      isAdmin: u.isAdmin,
      isDoc: u.isDoc,
      balance: u.hoursBalance,
      hoursBalance: u.hoursBalance
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/doc/users/:id/hours — get per-user entries with comments (read-only)
router.get('/users/:id/hours', verifyToken, requireDoc, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entries = await HoursEntry.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json({ balance: user.hoursBalance, entries });
  } catch (err) {
    console.error('Doc get user hours error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
