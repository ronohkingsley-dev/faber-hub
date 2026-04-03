// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/MarketCard.jsx
// ══════════════════════════════════════════════════════
import { FileCode, Eye, ShoppingBag, Tag, CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

const CAT_STYLES = {
  drawing:  { label: 'DRAWING',   color: 'amber',   icon: '📐' },
  '3d_model':{ label: '3D MODEL', color: 'sky',     icon: '🖥️' },
  schematic:{ label: 'SCHEMATIC', color: 'violet',  icon: '⚡' },
  source_code:{ label: 'CODE',    color: 'emerald', icon: '💻' },
  report:   { label: 'REPORT',    color: 'orange',  icon: '📄' },
  other:    { label: 'OTHER',     color: 'slate',   icon: '📦' },
};

export default function MarketCard({ listing, onClick, isOwner, onEdit, onDelete }) {
  const cs  = CAT_STYLES[listing.category] || CAT_STYLES.other;
  const col = cs.color;
  const sold = listing.status === 'sold';
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!listing.expires_at) return;
    const interval = setInterval(() => {
      const diff = new Date(listing.expires_at) - new Date();
      if (diff <= 0) { setTimeLeft('EXPIRED'); clearInterval(interval); return; }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [listing.expires_at]);

  return (
    <div onClick={() => !sold && !isOwner && onClick?.(listing)}
      className={`group relative bg-slate-900 border rounded-2xl overflow-hidden transition-all
        ${sold
          ? 'border-white/5 opacity-60 cursor-not-allowed'
          : 'border-white/5 hover:border-sky-500/30 hover:shadow-[0_0_24px_rgba(14,165,233,0.1)] cursor-pointer'
        }`}>

      {/* Category preview tile */}
      <div className={`h-36 flex items-center justify-center relative`}
        style={{ background: 'linear-gradient(135deg,#07070b 0%,#0f111a 100%)' }}>
        <div className="absolute inset-0 scanlines opacity-20" />
        <div className="text-4xl select-none">{cs.icon}</div>
        <div className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-md tracking-widest
          bg-${col}-500/15 text-${col}-400`}>{cs.label}</div>
        {listing.expires_at && timeLeft && (
          <div className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-md tracking-widest flex items-center gap-1
            ${timeLeft === 'EXPIRED' ? 'bg-slate-500/15 text-slate-400' : 'bg-red-500/20 text-red-400'}`}>
            <Clock className="w-3 h-3"/> {timeLeft}
          </div>
        )}
        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[10px] font-black tracking-widest">SOLD</span>
            </div>
          </div>
        )}
        {/* File type badge */}
        {listing.file_type && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <FileCode className="w-2.5 h-2.5" />.{listing.file_type}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className={`text-xs font-black leading-tight mb-1.5 line-clamp-2 transition-colors ${sold ? 'text-slate-500' : 'text-white group-hover:text-sky-300'}`}>
          {listing.title}
        </h3>
        <p className="text-[10px] text-slate-600 line-clamp-2 mb-3 leading-relaxed">{listing.description}</p>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[9px] font-black text-sky-400 flex-shrink-0">
            {(listing.seller_name || 'F')[0]}
          </div>
          <p className="text-[10px] text-slate-500 truncate">{listing.seller_name}</p>
        </div>
      </div>

      {/* Footer handles isOwner specifically */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-emerald-400" />
          <span className="text-sm font-black text-emerald-400">${listing.price?.toFixed(2)}</span>
          <span className="text-[9px] text-slate-600 ml-1">{listing.currency || 'USD'}</span>
        </div>
        
        {isOwner ? (
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit?.(listing); }} className="text-[9px] font-black px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-sky-400 transition-colors">EDIT</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete?.(listing); }} className="text-[9px] font-black px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-red-400 transition-colors">DEL</button>
          </div>
        ) : !sold && (
          <button className="flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all">
            <ShoppingBag className="w-3 h-3" />BUY
          </button>
        )}
      </div>

      {/* Views */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">
        <Eye className="w-2.5 h-2.5" />{listing.views || 0}
      </div>
    </div>
  );
}
