// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/reports.js
// ══════════════════════════════════════════════════════
const router       = require('express').Router();
const { v4: uuid } = require('uuid');
const DB           = require('../db');
const authenticate = require('../middleware/auth');

// POST /api/reports
router.post('/', authenticate, (req, res) => {
  const { reported_uid, reason, details } = req.body;
  if (!reported_uid || !reason) return res.status(400).json({ error: 'Missing reported user ID or reason' });

  // Auto-ban logic
  const keywords = details.toLowerCase();
  let status = 'pending';
  let severity = 'low';

  // SCAM -> Instant full ban
  if (keywords.includes('scam') || keywords.includes('fraud') || keywords.includes('stolen') || keywords.includes('fake')) {
    severity = 'critical';
    DB.updateUser(reported_uid, { status: 'banned', bio: '[ACCOUNT SUSPENDED FOR SEVERE VIOLATIONS]' });
    status = 'resolved_auto_banned';
  } 
  // SPAM/ABUSE -> Warn or Market Ban
  else if (keywords.includes('spam') || keywords.includes('abusive') || keywords.includes('insult')) {
    severity = 'high';
    const u = DB.findUserById(reported_uid);
    if (u) {
      const warnings = (u.warnings_count || 0) + 1;
      let newStatus = 'active';
      if (warnings >= 3) newStatus = 'banned';
      else if (warnings >= 2) newStatus = 'market_banned';
      DB.updateUser(reported_uid, { warnings_count: warnings, status: newStatus });
      status = `resolved_auto_warned_(${warnings}/3)`;
    }
  }

  const report = {
    id: uuid(),
    reporter_id: req.user.id,
    reported_uid,
    reason,
    details,
    severity,
    status,
    created_at: new Date().toISOString()
  };

  DB.insertReport(report);
  res.json({ message: 'Report submitted. Automated actions may have been taken.', report });
});

// GET /api/reports
router.get('/', authenticate, (req, res) => {
  if (req.user.role !== 'ROOT_ADMIN' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  res.json(DB.getAllReports());
});

// PATCH /api/reports/:id
router.patch('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'ROOT_ADMIN' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const updated = DB.updateReport(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Report not found' });
  res.json(updated);
});

// POST /api/admin/users/:id/action
router.post('/users/:id/action', authenticate, (req, res) => {
  if (req.user.role !== 'ROOT_ADMIN' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { action } = req.body; // 'ban', 'warn', 'market_ban', 'unban'
  const u = DB.findUserById(req.params.id);
  if(!u) return res.status(404).json({ error: 'User not found' });

  if (action === 'ban') {
    DB.updateUser(req.params.id, { status: 'banned' });
  } else if (action === 'warn') {
    DB.updateUser(req.params.id, { warnings_count: (u.warnings_count || 0) + 1 });
  } else if (action === 'market_ban') {
    DB.updateUser(req.params.id, { status: 'market_banned' });
  } else if (action === 'unban') {
    DB.updateUser(req.params.id, { status: 'active', warnings_count: 0 });
  }

  res.json({ message: `Action ${action} applied to user ${req.params.id}` });
});

module.exports = router;
