// ══════════════════════════════════════════════════════
//  FABER.NET · backend/db.js — Pure Node.js JSON Store
//  Zero native dependencies — uses fs.readFileSync/writeFileSync
// ══════════════════════════════════════════════════════
const fs     = require('fs');
const path   = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const DB_PATH = path.join(__dirname, 'faber-db.json');

// ─── LOAD / INIT ─────────────────────────────────────────────────────────────
let state = {
  users: [], posts: [], reactions: [], comments: [],
  stories: [], reels: [], tutorials: [],
  market_listings: [], transactions: [], notifications: [], reports: []
};

if (fs.existsSync(DB_PATH)) {
  try { state = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { /* reuse defaults */ }
}

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf8');
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function now() { return new Date().toISOString(); }

function generateNodeID() {
  const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FBR-${seg()}-MMUST`;
}

// ─── SEED ────────────────────────────────────────────────────────────────────
// Seed logic removed as requested: system starts clean and listens for new users.


// ─── ENRICH ──────────────────────────────────────────────────────────────────
function enrichPost(p) {
  const author = state.users.find(u => u.id === p.author_id) || {};
  return {
    ...p,
    author_id: p.author_id,
    author_name: author.name,
    author_node: author.node_id,
    department: author.department,
    avatar_url: author.avatar_url,
    reaction_count: state.reactions.filter(r => r.post_id === p.id).length,
    comment_count:  state.comments.filter(c => c.post_id === p.id).length,
  };
}
function enrichComment(c) {
  const a = state.users.find(u => u.id === c.author_id) || {};
  return { ...c, author_name: a.name, author_node: a.node_id, avatar_url: a.avatar_url };
}
function enrichStory(s) {
  const a = state.users.find(u => u.id === s.author_id) || {};
  return { ...s, author_name: a.name, author_node: a.node_id, department: a.department, avatar_url: a.avatar_url };
}
function enrichReel(r) {
  const a = state.users.find(u => u.id === r.author_id) || {};
  return { ...r, author_name: a.name, author_node: a.node_id, department: a.department, avatar_url: a.avatar_url };
}
function enrichTutorial(t) {
  const a = state.users.find(u => u.id === t.author_id) || {};
  return { ...t, author_name: a.name, department: a.department, avatar_url: a.avatar_url };
}
function enrichListing(l) {
  const s = state.users.find(u => u.id === l.seller_id) || {};
  const sc = state.transactions.filter(t => t.listing_id === l.id).length;
  return { ...l, seller_name: s.name, seller_node: s.node_id, department: s.department, sale_count: sc };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
module.exports = {
  generateNodeID,

  // Users
  findUserByEmail: (e)  => state.users.find(u => u.email === e),
  findUserById:    (id) => state.users.find(u => u.id === id),
  insertUser: (u) => { state.users.push(u); save(); return u; },
  updateUser: (id, fields) => {
    const u = state.users.find(u => u.id === id);
    if (u) { Object.assign(u, fields); save(); }
    return u;
  },
  sanitizeUser: (u) => { if (!u) return null; const { password, ...r } = u; return r; },
  getAllUsers: () => state.users.map(u => {
    const { password, ...safe } = u;
    return {
      ...safe,
      posts:    state.posts.filter(p => p.author_id === u.id).length,
      listings: state.market_listings.filter(l => l.seller_id === u.id).length,
      sales:    state.transactions.filter(t => t.seller_id === u.id).length,
      revenue:  state.transactions.filter(t => t.seller_id === u.id).reduce((s, t) => s + t.seller_payout, 0),
    };
  }),

  // Posts
  getAllPosts: ({ type, page = 1, limit = 20 } = {}) => {
    let list = [...state.posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (type) list = list.filter(p => p.type === type);
    return list.slice((page-1)*limit, (page-1)*limit + limit).map(enrichPost);
  },
  findPostById: (id) => {
    const p = state.posts.find(p => p.id === id);
    if (!p) return null;
    return { ...enrichPost(p), comments: state.comments.filter(c => c.post_id === id).map(enrichComment) };
  },
  insertPost: (p) => { state.posts.push(p); save(); return enrichPost(p); },
  updatePost: (id, uid, data) => {
    const post = state.posts.find(p => p.id === id && p.author_id === uid);
    if (!post) return null;
    if (data.title) post.title = data.title;
    if (data.body) post.body = data.body;
    if (data.type) post.type = data.type;
    if (data.mentions !== undefined) post.mentions = data.mentions;
    save();
    return enrichPost(post);
  },
  deletePost: (id, uid) => { 
    if(!uid) { state.posts = state.posts.filter(p => p.id !== id); save(); return true; } // Admin fallback
    const idx = state.posts.findIndex(p => p.id === id && p.author_id === uid);
    if(idx !== -1) { state.posts.splice(idx, 1); save(); return true; }
    return false;
  },
  findRawPost: (id) => state.posts.find(p => p.id === id),

  // Reactions
  toggleReaction: (postId, userId, emoji = '⚡') => {
    const idx = state.reactions.findIndex(r => r.post_id === postId && r.user_id === userId);
    if (idx >= 0) state.reactions.splice(idx, 1);
    else state.reactions.push({ id: uuid(), post_id: postId, user_id: userId, emoji });
    save();
    return state.reactions.filter(r => r.post_id === postId).length;
  },

  // Comments
  insertComment: (c) => { state.comments.push(c); save(); return enrichComment(c); },

  // Stories
  getActiveStories: () => state.stories.filter(s => new Date(s.expires_at) > new Date()).map(enrichStory),
  insertStory: (s) => { state.stories.push(s); save(); return enrichStory(s); },
  findStoryById: (id) => state.stories.find(s => s.id === id),
  deleteStory: (id) => { state.stories = state.stories.filter(s => s.id !== id); save(); },

  // Reels
  getReels: ({ page=1, limit=10 } = {}) => [...state.reels].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice((page-1)*limit, (page-1)*limit+limit).map(enrichReel),
  insertReel: (r) => { state.reels.push(r); save(); return enrichReel(r); },
  deleteReel: (id, uid) => {
    const idx = state.reels.findIndex(r => r.id === id && r.author_id === uid);
    if(idx !== -1) { state.reels.splice(idx, 1); save(); return true; }
    return false;
  },
  toggleReelLike: (id, uid) => {
    const r = state.reels.find(r => r.id===id);
    if(r){
      r.liked_by = r.liked_by || [];
      const idx = r.liked_by.indexOf(uid);
      if(idx >= 0) { r.liked_by.splice(idx, 1); r.likes = Math.max(0, (r.likes||1)-1); }
      else { r.liked_by.push(uid); r.likes = (r.likes||0)+1; }
      save();
    }
    return r;
  },

  // Tutorials
  // Tutorials
  getTutorials: ({ category, page=1, limit=12 } = {}) => {
    let list = [...state.tutorials].sort((a,b) => (b.views||0)-(a.views||0));
    if (category) list = list.filter(t => t.category === category);
    return list.slice((page-1)*limit, (page-1)*limit+limit).map(enrichTutorial);
  },
  insertTutorial: (t) => { state.tutorials.push(t); save(); return enrichTutorial(t); },
  viewTutorial: (id) => { const t = state.tutorials.find(t => t.id===id); if(t){ t.views=(t.views||0)+1; save(); } },

  // Market
  getListings: ({ category, status='active', page=1, limit=24 } = {}) => {
    let list = [...state.market_listings].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    list = list.filter(l => l.status === status && (!l.expires_at || new Date(l.expires_at) > new Date()));
    if (category) list = list.filter(l => l.category === category);
    return list.slice((page-1)*limit, (page-1)*limit+limit).map(enrichListing);
  },
  findListingById: (id) => {
    const l = state.market_listings.find(l => l.id === id);
    if (!l) return null;
    l.views = (l.views||0) + 1; save();
    return enrichListing(l);
  },
  findRawListing: (id) => state.market_listings.find(l => l.id === id),
  insertListing: (l) => { state.market_listings.push(l); save(); return enrichListing(l); },
  updateListing: (id, fields) => {
    const l = state.market_listings.find(l => l.id === id);
    if (l) { Object.assign(l, fields); save(); }
    return l ? enrichListing(l) : null;
  },
  deleteListing: (id) => { state.market_listings = state.market_listings.filter(l => l.id !== id); save(); },
  getMyListings: (sid) => state.market_listings.filter(l => l.seller_id === sid).map(l => {
    const txs = state.transactions.filter(t => t.listing_id === l.id);
    return { ...enrichListing(l), sale_count: txs.length, revenue: txs.reduce((s,t) => s+t.seller_payout, 0) };
  }),
  getSellerListings: (uid) => state.market_listings.filter(l => l.seller_id === uid).map(enrichListing).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)),
  deleteListing: (id, uid) => { 
    const idx = state.market_listings.findIndex(l => l.id === id && l.seller_id === uid); 
    if (idx !== -1) { state.market_listings.splice(idx, 1); save(); return true; } 
    return false; 
  },
  updateListing: (id, uid, fields) => {
    const l = state.market_listings.find(x => x.id === id && x.seller_id === uid);
    if(l) { Object.assign(l, fields); save(); return l; }
    return null;
  },

  // Transactions
  insertTransaction: (tx) => { state.transactions.push(tx); save(); return tx; },
  getMyPurchases: (bid) => state.transactions.filter(t => t.buyer_id === bid).map(t => {
    const l = state.market_listings.find(l => l.id === t.listing_id) || {};
    const s = state.users.find(u => u.id === t.seller_id) || {};
    return { ...t, title: l.title, category: l.category, file_url: l.file_url, file_type: l.file_type, seller_name: s.name };
  }),
  getAdminSummary: () => {
    const txs = state.transactions;
    const recent = [...txs].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,50).map(tx => {
      const l  = state.market_listings.find(l => l.id === tx.listing_id) || {};
      const bu = state.users.find(u => u.id === tx.buyer_id) || {};
      const su = state.users.find(u => u.id === tx.seller_id) || {};
      return { ...tx, title: l.title, buyer_name: bu.name, seller_name: su.name };
    });
    return {
      total_transactions: txs.length,
      total_volume:     txs.reduce((s,t) => s+t.amount, 0),
      total_commission: txs.reduce((s,t) => s+t.commission, 0),
      total_payouts:    txs.reduce((s,t) => s+t.seller_payout, 0),
      listingCount: state.market_listings.length,
      userCount:    state.users.length,
      recentTransactions: recent,
    };
  },

  // Notifications
  getNotifications: (uid) => [...state.notifications].filter(n => n.user_id === uid).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,30),
  insertNotification: (n) => { state.notifications.push(n); save(); },
  markRead: (id, uid) => { const n = state.notifications.find(n => n.id===id && n.user_id===uid); if(n){ n.read=1; save(); } },
  markAllRead: (uid) => { state.notifications.filter(n => n.user_id===uid).forEach(n => n.read=1); save(); },

  // User stats
  getUserStats: (uid) => ({
    postCount:    state.posts.filter(p => p.author_id === uid).length,
    listingCount: state.market_listings.filter(l => l.seller_id === uid).length,
    revenue:      state.transactions.filter(t => t.seller_id === uid).reduce((s,t) => s+t.seller_payout, 0),
  }),

  // Reports
  getAllReports: () => [...state.reports].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(r => {
    const ru = state.users.find(u => u.id === r.reported_uid) || {};
    const su = state.users.find(u => u.id === r.reporter_id) || {};
    return { ...r, reported_name: ru.name, reported_email: ru.email, reporter_name: su.name };
  }),
  insertReport: (r) => { state.reports.push(r); save(); return r; },
  updateReport: (id, fields) => { const r = state.reports.find(x => x.id === id); if(r) { Object.assign(r, fields); save(); return r; } return null; },
};
