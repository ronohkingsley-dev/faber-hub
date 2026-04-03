// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/admin.js
//  Admin-only endpoints
// ══════════════════════════════════════════════════════
const router       = require('express').Router();
const authenticate = require('../middleware/auth');
const DB           = require('../db');

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// GET /api/admin/users — list all users with stats (admin only)
router.get('/users', authenticate, requireAdmin, (req, res) => {
  res.json(DB.getAllUsers());
});

// PATCH /api/admin/users/:id — update user role
router.patch('/users/:id', authenticate, requireAdmin, (req, res) => {
  const user = DB.findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const updated = DB.updateUser(req.params.id, { role: req.body.role });
  res.json({ ok: true, user: DB.sanitizeUser(updated) });
});

module.exports = router;
