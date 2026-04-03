// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/tutorials.js
// ══════════════════════════════════════════════════════
const router       = require('express').Router();
const { v4: uuid } = require('uuid');
const DB           = require('../db');
const authenticate = require('../middleware/auth');

router.get('/', (req, res) => {
  const { category, page = 1, limit = 12 } = req.query;
  res.json(DB.getTutorials({ category: category === 'all' ? undefined : category, page: Number(page), limit: Number(limit) }));
});

router.post('/', authenticate, (req, res) => {
  const { title, description, video_url, thumbnail, duration, category } = req.body;
  if (!title || !video_url) return res.status(400).json({ error: 'title and video_url required' });
  const t = { id: uuid(), author_id: req.user.id, title, description: description || '', video_url, thumbnail: thumbnail || null, duration: duration || '0:00', category: category || 'General', views: 0, created_at: new Date().toISOString() };
  res.status(201).json(DB.insertTutorial(t));
});

router.post('/:id/view', (req, res) => {
  DB.viewTutorial(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
