// ══════════════════════════════════════════════════════
//  FABER.NET · backend/routes/marketplace.js
// ══════════════════════════════════════════════════════
const router       = require('express').Router();
const { v4: uuid } = require('uuid');
const DB           = require('../db');
const authenticate = require('../middleware/auth');

const COMMISSION_RATE = Number(process.env.COMMISSION_RATE) || 0.10;

const calculateSplit = (price) => {
  return {
    Creator_Cut: parseFloat((price * 0.9).toFixed(2)),
    Admin_Fee: parseFloat((price * 0.1).toFixed(2))
  };
};

// GET /api/market
router.get('/', (req, res) => {
  const { category, status = 'active', page = 1, limit = 24 } = req.query;
  const listings = DB.getListings({ category: category === 'all' ? undefined : category, status, page: Number(page), limit: Number(limit) });
  // Always hide file_url in public list
  res.json(listings.map(l => ({ ...l, file_url: null })));
});

// GET /api/market/my-listings
router.get('/my-listings', authenticate, (req, res) => {
  res.json(DB.getSellerListings(req.user.id));
});

// GET /api/market/my-purchases
router.get('/my-purchases', authenticate, (req, res) => {
  res.json(DB.getMyPurchases(req.user.id));
});

// GET /api/market/admin-summary
router.get('/admin-summary', authenticate, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'ROOT_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  res.json(DB.getAdminSummary());
});

// GET /api/market/:id
router.get('/:id', (req, res) => {
  const listing = DB.findListingById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // Hide file_url unless owner or buyer
  let canDownload = false;
  
  // Custom auth parsing just for this route
  const authHeader = req.headers.authorization;
  if(authHeader) {
     try {
       const token = authHeader.split(' ')[1];
       const jwt = require('jsonwebtoken');
       const user = jwt.verify(token, process.env.JWT_SECRET || 'faber_jwt_secret_dev');
       if (user.role === 'ROOT_ADMIN' || user.role === 'admin' || listing.seller_id === user.id) {
         canDownload = true;
       } else {
         const isBuyer = DB.getMyPurchases(user.id).some(t => t.listing_id === listing.id);
         if (isBuyer) canDownload = true;
       }
     } catch(e) {}
  }

  if (!canDownload) {
    listing.file_url = null;
  }

  res.json(listing);
});

// POST /api/market
router.post('/', authenticate, (req, res) => {
  if (req.user.status === 'market_banned' || req.user.status === 'banned') return res.status(403).json({ error: 'ACCOUNT RESTRICTED: You are suspended from creating new market listings.' });
  const { title, description, category, price, file_url, preview_url, file_type, tags, demo_video_url, duration } = req.body;
  if (!title || !description || !price) return res.status(400).json({ error: 'title, description and price are required' });
  
  let expires_at = null;
  if (duration && Number(duration) > 0) {
    const d = new Date();
    d.setHours(d.getHours() + Number(duration));
    expires_at = d.toISOString();
  }

  const listing = { 
    id: uuid(), seller_id: req.user.id, title, description, category: category || 'drawing', 
    price: Number(price), currency: 'USD', file_url: file_url || null, preview_url: preview_url || null, 
    demo_video_url: demo_video_url || null, file_type: file_type || null, tags: tags || '', 
    status: 'active', views: 0, expires_at: expires_at, created_at: new Date().toISOString() 
  };
  DB.insertListing(listing);
  res.status(201).json(DB.findListingById(listing.id));
});

// PATCH /api/market/:id
router.patch('/:id', authenticate, (req, res) => {
  const listing = DB.findListingById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (listing.seller_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'ROOT_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { title, description, price, category, tags, status } = req.body;
  const updated = DB.updateListing(req.params.id, listing.seller_id, { ...(title && { title }), ...(description && { description }), ...(price && { price: Number(price) }), ...(category && { category }), ...(tags !== undefined && { tags }), ...(status && { status }) });
  res.json(updated);
});

// POST /api/market/:id/buy
router.post('/:id/buy', authenticate, (req, res) => {
  const listing = DB.findListingById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== 'active') return res.status(400).json({ error: 'This item is no longer available' });
  if (listing.seller_id === req.user.id) return res.status(400).json({ error: 'Cannot buy your own listing' });

  const amount       = listing.price;
  const split        = calculateSplit(amount);
  const commission   = split.Admin_Fee;
  const sellerPayout = split.Creator_Cut;

  const tx = { id: uuid(), listing_id: listing.id, buyer_id: req.user.id, seller_id: listing.seller_id, amount, commission, seller_payout: sellerPayout, Admin_Ledger: commission, status: 'completed', created_at: new Date().toISOString() };
  DB.insertTransaction(tx);
  DB.updateListing(listing.id, { status: 'sold' });
  DB.insertNotification({ id: uuid(), user_id: listing.seller_id, type: 'sale', message: `Your listing "${listing.title}" sold for $${amount}. You earn $${sellerPayout} after platform fee.`, read: 0, created_at: new Date().toISOString() });

  res.json({
    transaction: { id: tx.id, amount, commission, sellerPayout, commissionRate: COMMISSION_RATE },
    listing,
    message: 'Purchase successful! File access granted.'
  });
});

// DELETE /api/market/:id
router.delete('/:id', authenticate, (req, res) => {
  const listing = DB.findListingById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (listing.seller_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'ROOT_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  DB.deleteListing(req.params.id, listing.seller_id);
  res.json({ ok: true });
});

module.exports = router;
