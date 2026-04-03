// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/auth.js
// ══════════════════════════════════════════════════════
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const DB      = require('../db');
const authenticate = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'faber_jwt_secret_dev';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, node_id: user.node_id, role: user.role, department: user.department },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

  if (DB.findUserByEmail(email)) return res.status(409).json({ error: 'Email already registered' });

  const allUsers = DB.getAllUsers() || [];
  const role = allUsers.length === 0 ? 'ROOT_ADMIN' : 'user';

  const user = { id: uuid(), name, email, password: bcrypt.hashSync(password, 10), department: department || 'Mechanical', node_id: DB.generateNodeID(), role, bio: '', avatar_url: '', created_at: new Date().toISOString() };
  DB.insertUser(user);
  res.json({ token: makeToken(user), user: DB.sanitizeUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = DB.findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'AUTH_FAILURE: Invalid credentials' });
  res.json({ token: makeToken(user), user: DB.sanitizeUser(user) });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required' });
  const user = DB.findUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  DB.updateUser(user.id, { password: bcrypt.hashSync(newPassword, 10) });
  res.json({ message: 'Password reset successfully. You can now log in.' });
});

// POST /api/auth/demo
router.post('/demo', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required for demo access' });
  
  const user = { 
    id: uuid(), 
    name: 'Guest Engineer', 
    email, 
    password: bcrypt.hashSync(uuid(), 10), 
    department: 'Guest', 
    node_id: `DEMO-${Math.random().toString(36).substring(2,6).toUpperCase()}`, 
    role: 'demo', 
    bio: 'Viewing the platform in Demo mode.', 
    avatar_url: '', 
    created_at: new Date().toISOString() 
  };
  DB.insertUser(user);
  res.json({ token: makeToken(user), user: DB.sanitizeUser(user) });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = DB.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(DB.sanitizeUser(user));
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, (req, res) => {
  const { bio, department, name } = req.body;
  const updated = DB.updateUser(req.user.id, { ...(bio && { bio }), ...(department && { department }), ...(name && { name }) });
  res.json(DB.sanitizeUser(updated));
});

module.exports = router;
