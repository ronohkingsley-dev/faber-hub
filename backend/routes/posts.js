// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/posts.js
// ══════════════════════════════════════════════════════
const router       = require('express').Router();
const { v4: uuid } = require('uuid');
const DB           = require('../db');
const authenticate = require('../middleware/auth');

// GET /api/posts
router.get('/', (req, res) => {
  const { page = 1, limit = 20, type } = req.query;
  // Optional auth parsing
  let viewerId = null;
  const header = req.headers['authorization'];
  if (header) {
    try { viewerId = require('jsonwebtoken').verify(header.replace('Bearer ', ''), process.env.JWT_SECRET || 'faber_jwt_secret_dev').id; } catch(e){}
  }

  let posts = DB.getAllPosts({ type: type && type !== 'all' ? type : undefined, limit: 1000 });
  // Visibility filtering
  posts = posts.filter(p => p.privacy !== 'private' || p.author_id === viewerId);
  // Manual slice since we filtered
  posts = posts.slice((page-1)*limit, page*limit);
  res.json(posts);
});

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  const post = DB.findPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// POST /api/posts
router.post('/', authenticate, (req, res) => {
  const { title, body, type, file_name, file_url, file_type, privacy, mentions } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });
  const post = {
    id: uuid(), author_id: req.user.id, title, body, mentions: mentions || '',
    type: type || 'blog', file_name: file_name || null, file_url: file_url || null,
    file_type: file_type || null, privacy: privacy || 'public', created_at: new Date().toISOString()
  };
  res.status(201).json(DB.insertPost(post));
});

// POST /api/posts/:id/react
router.post('/:id/react', authenticate, (req, res) => {
  const { emoji = '⚡' } = req.body;
  const count = DB.toggleReaction(req.params.id, req.user.id, emoji);
  
  // Notify author if reacting (count increased)
  const post = DB.findRawPost(req.params.id);
  if (post && post.author_id !== req.user.id) {
    DB.insertNotification({
      user_id: post.author_id,
      title: 'New Reaction',
      body: `${req.user.name.split(' ')[0]} reacted to your post: "${post.title.substring(0, 20)}..."`,
      type: 'reaction',
      link: `/feed`
    });
  }

  res.json({ reactions: count });
});

// POST /api/posts/:id/comment
router.post('/:id/comment', authenticate, (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Comment body required' });
  const comment = { id: uuid(), post_id: req.params.id, author_id: req.user.id, body, created_at: new Date().toISOString() };
  res.status(201).json(DB.insertComment(comment));
});

// GET /api/posts/my-posts
router.get('/my-posts', authenticate, (req, res) => {
  const posts = DB.getAllPosts({ limit: 1000 }).filter(p => p.author_id === req.user.id);
  res.json(posts);
});

// DELETE /api/posts/:id
router.delete('/:id', authenticate, (req, res) => {
  const post = DB.findPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'ROOT_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  DB.deletePost(req.params.id, post.author_id);
  res.json({ ok: true });
});

// PUT /api/posts/:id
router.put('/:id', authenticate, (req, res) => {
  const { title, body, type, mentions } = req.body;
  const post = DB.updatePost(req.params.id, req.user.id, { title, body, type, mentions });
  if (!post) return res.status(403).json({ error: 'Forbidden or not found' });
  res.json(post);
});

module.exports = router;
