// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/reels.js
// ══════════════════════════════════════════════════════
const router       = require('express').Router();
const { v4: uuid } = require('uuid');
const DB           = require('../db');
const authenticate = require('../middleware/auth');

router.get('/', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  let viewerId = null;
  const header = req.headers['authorization'];
  if (header) {
    try { viewerId = require('jsonwebtoken').verify(header.replace('Bearer ', ''), process.env.JWT_SECRET || 'faber_jwt_secret_dev').id; } catch(e){}
  }
  let reels = DB.getReels({ limit: 1000 });
  reels = reels.filter(r => r.privacy !== 'private' || r.author_id === viewerId);
  reels = reels.slice((page-1)*limit, page*limit);
  res.json(reels);
});

router.get('/my-reels', authenticate, (req, res) => {
  const reels = DB.getReels({ limit: 1000 }).filter(r => r.author_id === req.user.id);
  res.json(reels);
});

router.post('/', authenticate, (req, res) => {
  const { title, description, video_url, thumbnail, listing_id, privacy } = req.body;
  if (!title || !video_url) return res.status(400).json({ error: 'title and video_url required' });
  const reel = { id: uuid(), author_id: req.user.id, title, description: description || '', video_url, thumbnail: thumbnail || null, listing_id: listing_id || null, likes: 0, views: 0, privacy: privacy || 'public', created_at: new Date().toISOString() };
  res.status(201).json(DB.insertReel(reel));
});

router.post('/:id/like', authenticate, (req, res) => {
  const reel = DB.toggleReelLike(req.params.id, req.user.id);
  res.json({ success: true, likes: reel ? reel.likes : 0, liked_by: reel ? reel.liked_by : [] });
});

router.delete('/:id', authenticate, (req, res) => {
  if(DB.deleteReel(req.params.id, req.user.id)) {
    res.json({ ok: true });
  } else {
    res.status(403).json({ error: 'Cannot delete this reel' });
  }
});

module.exports = router;
