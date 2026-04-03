// ══════════════════════════════════════════════════════
//  FABER.NET · src/pages/MarketPage.jsx
// ══════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, X, Tag, Eye, FileCode, Box, Video, Download, CheckCircle, ArrowLeft } from 'lucide-react';
import MarketCard from '../components/MarketCard';
import PaymentModal from '../components/PaymentModal';
import CreateListing from '../components/CreateListing';
import ModelViewer from '../components/ModelViewer';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

const CATS = [
  { value: 'all',         label: 'ALL' },
  { value: 'drawing',     label: '📐 DRAWINGS' },
  { value: '3d_model',    label: '🖥️ 3D MODELS' },
  { value: 'schematic',   label: '⚡ SCHEMATICS' },
  { value: 'source_code', label: '💻 CODE' },
  { value: 'report',      label: '📄 REPORTS' },
];

export default function MarketPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [listings, setListings]     = useState([]);
  const [cat, setCat]               = useState('all');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null); // listing detail view
  const [showPay, setShowPay]       = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/market', { params: { category: cat === 'all' ? undefined : cat, limit: 48 } });
      setListings(data);
    } catch { push('Failed to load marketplace', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchListings(); }, [cat]);

  const filtered = search.trim()
    ? listings.filter(l =>
        l.title?.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase()) ||
        l.tags?.toLowerCase().includes(search.toLowerCase()))
    : listings;

  const handleCreated = (listing) => { setListings(prev => [listing, ...prev]); };
  const handlePurchased = () => { setShowPay(false); setSelected(null); fetchListings(); };

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────────
  if (selected) return (
    <ListingDetail
      listing={selected}
      onBack={() => setSelected(null)}
      onBuy={() => setShowPay(true)}
      onPurchased={handlePurchased}
      showPay={showPay}
      onClosePay={() => setShowPay(false)}
    />
  );

  return (
    <div className="min-h-screen bg-slate-950 pt-14 pb-20 md:pb-4">
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Marketplace</h1>
              <p className="text-[9px] sm:text-[10px] text-slate-600 hidden sm:block">Buy & sell engineering assets</p>
            </div>
          </div>
          {user && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all shadow-[0_0_16px_rgba(14,165,233,0.3)] flex-shrink-0">
              <Plus className="w-3.5 h-3.5" /><span className="hidden sm:inline">LIST ITEM</span><span className="sm:hidden">LIST</span>
            </button>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="sticky top-14 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 px-4 py-2">
        <div className="max-w-6xl mx-auto flex gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/5 pl-8 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-700 outline-none focus:border-sky-500/50 transition-all" />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {CATS.map(c => (
              <button key={c.value} onClick={() => setCat(c.value)}
                className={`flex-shrink-0 text-[9px] font-black tracking-wide px-2.5 py-1.5 rounded-lg transition-all
                  ${cat === c.value ? 'bg-sky-500/15 text-sky-400' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-[10px] text-slate-600">
          <span className="font-bold">{filtered.length} listings</span>
          <span>·</span>
          <span>10% platform commission on all sales</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-slate-900 border border-white/5 rounded-2xl h-56 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">No listings found</p>
            {user && <button onClick={() => setShowCreate(true)} className="mt-4 text-[10px] text-sky-400 hover:text-sky-300 font-bold underline underline-offset-4">Be the first to list something</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map(l => <MarketCard key={l.id} listing={l} onClick={setSelected} />)}
          </div>
        )}
      </div>

      {showCreate && <CreateListing onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

// ── LISTING DETAIL ────────────────────────────────────────────────────────────
function ListingDetail({ listing, onBack, onBuy, onPurchased, showPay, onClosePay }) {
  const { user } = useAuth();
  const tags = listing.tags ? listing.tags.split(',').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-slate-950 pt-14 pb-20 md:pb-4">
      <div className="max-w-3xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-sky-400 transition-colors mb-4 sm:mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />BACK TO MARKETPLACE
        </button>

        {/* Preview / 3D Viewer */}
        <ModelViewer fileUrl={listing.file_url} fileType={listing.file_type} title={listing.title} previewUrl={listing.preview_url} />

        {/* Demo video (if separate from main file) */}
        {listing.demo_video_url && (
          <div className="mt-3">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Video className="w-3 h-3" />DEMO VIDEO</p>
            <video src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}${listing.demo_video_url}`} controls className="w-full rounded-xl border border-white/5 max-h-64 object-contain bg-black" />
          </div>
        )}

        {/* Info */}
        <div className="mt-4 sm:mt-6 grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-4">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white leading-tight">{listing.title}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[10px] font-black text-sky-400">
                  {(listing.seller_name || 'F')[0]}
                </div>
                <p className="text-xs text-sky-400 font-bold">{listing.seller_name}</p>
                <span className="text-slate-700">·</span>
                <p className="text-[10px] text-slate-600">{listing.department}</p>
                <Eye className="w-3 h-3 text-slate-700 ml-auto" />
                <span className="text-[9px] text-slate-600">{listing.views || 0} views</span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">{listing.description}</p>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="text-[9px] font-bold text-sky-400/70 bg-sky-500/5 border border-sky-500/15 px-2 py-0.5 rounded-md uppercase">
                    {t.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* File info */}
            {listing.file_type && (
              <div className="flex items-center gap-2 p-3 bg-black/40 border border-white/5 rounded-xl">
                <FileCode className="w-4 h-4 text-sky-400" />
                <p className="text-xs text-slate-300 font-bold">.{listing.file_type?.toUpperCase()} file included on purchase</p>
              </div>
            )}
          </div>

          {/* Purchase card */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-3 h-fit">
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Price</p>
              <p className="text-3xl font-black text-emerald-400">${listing.price?.toFixed(2)}</p>
              <p className="text-[9px] text-slate-600">{listing.currency || 'USD'}</p>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Platform fee (10%)</span>
                <span className="text-amber-400 font-bold">${(listing.price * 0.10).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Seller receives</span>
                <span className="text-emerald-400 font-bold">${(listing.price * 0.90).toFixed(2)}</span>
              </div>
            </div>

            {listing.status === 'sold' ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black text-emerald-400">SOLD</span>
              </div>
            ) : user ? (
              <button onClick={onBuy}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black text-xs py-3 rounded-xl transition-all shadow-[0_0_16px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2 accent-pulse">
                <ShoppingBag className="w-4 h-4" />BUY NOW
              </button>
            ) : (
              <p className="text-center text-[10px] text-slate-600 font-bold">Login to purchase</p>
            )}

            <p className="text-[9px] text-slate-700 text-center flex items-center justify-center gap-1">
              🔒 Secure payment · Instant file access
            </p>
          </div>
        </div>
      </div>

      {showPay && <PaymentModal listing={listing} onClose={onClosePay} onPurchased={onPurchased} />}
    </div>
  );
}
