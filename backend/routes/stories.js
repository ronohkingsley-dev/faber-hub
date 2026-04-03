// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/stories.js
// ══════════════════════════════════════════════════════
const router       = require('express').Router();
const { v4: uuid } = require('uuid');
const DB           = require('../db');
const authenticate = require('../middleware/auth');

router.get('/', (req, res) => res.json(DB.getActiveStories()));

router.post('/', authenticate, (req, res) => {
  const { media_url, thumbnail, caption } = req.body;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const story = { id: uuid(), author_id: req.user.id, media_url: media_url || null, thumbnail: thumbnail || null, caption: caption || '', expires_at: expires, created_at: new Date().toISOString() };
  res.status(201).json(DB.insertStory(story));
});

router.delete('/:id', authenticate, (req, res) => {
  const story = DB.findStoryById(req.params.id);
  if (!story) return res.status(404).json({ error: 'Not found' });
  if (story.author_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  DB.deleteStory(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
