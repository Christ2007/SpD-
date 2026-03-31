const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'speeddrone_secret_key_2024';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireDoc(req, res, next) {
  if (!req.user || (!req.user.isDoc && !req.user.isAdmin)) {
    return res.status(403).json({ error: 'Doc access required' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin, requireDoc, JWT_SECRET };
