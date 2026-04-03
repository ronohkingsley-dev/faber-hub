// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/upload.js
//  Handles file uploads via multer
// ══════════════════════════════════════════════════════
const router       = require('express').Router();
const multer       = require('multer');
const path         = require('path');
const { v4: uuid } = require('uuid');
const authenticate = require('../middleware/auth');

const ALLOWED_EXT = new Set([
  '.dwg', '.dxf', '.ipt', '.iam', '.igs', '.step', '.stp',
  '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.svg',
  '.mp4', '.mov', '.webm',
  '.kicad_pro', '.sch', '.brd',
  '.zip', '.rar', '.7z',
  '.xlsx', '.csv', '.txt', '.md'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type || 'misc';
    const dest = path.join(__dirname, '..', 'uploads', type);
    require('fs').mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const safe = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    cb(null, `${safe}_${uuid().slice(0, 8)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return cb(new Error(`File type ${ext} not allowed`));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

// POST /api/upload?type=post|market|story|reel|tutorial
router.post('/', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const type    = req.query.type || 'misc';
  const fileUrl = `/uploads/${type}/${req.file.filename}`;
  res.json({
    url:          fileUrl,
    originalName: req.file.originalname,
    size:         req.file.size,
    mimetype:     req.file.mimetype,
    filename:     req.file.filename
  });
});

module.exports = router;
