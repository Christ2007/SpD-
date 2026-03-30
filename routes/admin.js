const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const HoursEntry = require('../models/HoursEntry');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/users — list all users with balances
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ username: 1 });
    // front-end expects `balance` property
    const formatted = users.map(u => ({
      id: u._id,
      username: u.username,
      displayName: u.displayName || u.username,
      isAdmin: u.isAdmin,
      balance: u.hoursBalance,
      hoursBalance: u.hoursBalance
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users/:id/hours — get per-user entries and balance
router.get('/users/:id/hours', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entries = await HoursEntry.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json({ balance: user.hoursBalance, entries });
  } catch (err) {
    console.error('Admin get user hours error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id/hours/entries — remove selected entries and adjust balance
router.delete('/users/:id/hours/entries', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { entryIds } = req.body;
    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({ error: 'entryIds array is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entries = await HoursEntry.find({ _id: { $in: entryIds }, userId: user._id });
    const totalRemoved = entries.reduce((sum, e) => sum + e.quarters, 0);

    if (entries.length === 0) {
      return res.status(404).json({ error: 'No matching entries found' });
    }

    await HoursEntry.deleteMany({ _id: { $in: entryIds }, userId: user._id });
    user.hoursBalance = Math.max(0, user.hoursBalance - totalRemoved);
    await user.save();

    res.json({ message: 'Entries deleted', removedCount: entries.length, newBalance: user.hoursBalance });
  } catch (err) {
    console.error('Admin delete entries error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/users — create new user
router.post('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      username: username.toLowerCase().trim(),
      passwordHash,
      displayName: displayName || username,
      isAdmin: false,
      hoursBalance: 0
    });
    await user.save();

    const { passwordHash: _, ...safeUser } = user.toObject();
    res.status(201).json({ message: 'User created successfully', user: safeUser });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id — delete a user
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ error: 'Cannot delete admin user' });

    await User.findByIdAndDelete(req.params.id);
    await HoursEntry.deleteMany({ userId: req.params.id });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/entries — all entries
router.get('/entries', verifyToken, requireAdmin, async (req, res) => {
  try {
    const entries = await HoursEntry.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
