// ══════════════════════════════════════════════════════
//  FABER.NET · backend/middleware/auth.js
// ══════════════════════════════════════════════════════
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'faber_jwt_secret_dev';

module.exports = function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Lazy load DB to avoid circular dependency
    const DB = require('../db');
    const dbUser = DB.findUserById(decoded.id);

    if (!dbUser) return res.status(401).json({ error: 'User account no longer exists' });
    if (dbUser.status === 'banned') return res.status(403).json({ error: 'ACCOUNT SUSPENDED: Platform violations detected.' });

    // Inject fresh details into req.user
    req.user = { ...decoded, status: dbUser.status, role: dbUser.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
