require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://10.0.0.66:27017/speeddrone_hours';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hours', require('./routes/hours'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/doc', require('./routes/doc'));

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Seed admin user
async function seedAdmin() {
  try {
    const User = require('./models/User');
    const existing = await User.findOne({ username: 'admin' });
    if (!existing) {
      const passwordHash = await bcrypt.hash('admin##', 10);
      await User.create({
        username: 'admin',
        passwordHash,
        displayName: 'Administrator',
        isAdmin: true,
        hoursBalance: 0
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
}

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log(`✅ Connected to MongoDB at ${MONGO_URI}`);
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`🚀 SpeedDrone Hours Tracker running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
