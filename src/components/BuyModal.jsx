// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/BuyModal.jsx
//  Shows price breakdown with 10% platform commission
// ══════════════════════════════════════════════════════
import { useState } from 'react';
import { X, ShoppingBag, Tag, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

const COMMISSION_RATE = 0.10;

export default function BuyModal({ listing, onClose, onPurchased }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [busy, setBusy]       = useState(false);
  const [done, setDone]       = useState(false);
  const [txData, setTxData]   = useState(null);

  const commission   = parseFloat((listing.price * COMMISSION_RATE).toFixed(2));
  const sellerEarns  = parseFloat((listing.price - commission).toFixed(2));

  const handleBuy = async () => {
    setBusy(true);
    try {
      const { data } = await API.post(`/market/${listing.id}/buy`);
      setTxData(data.transaction);
      setDone(true);
      push(`Purchase successful! "${listing.title}" is now yours.`, 'success');
      onPurchased?.(data);
    } catch (err) {
      push(err.response?.data?.error || 'Purchase failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-white/10 w-full md:max-w-md rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl modal-in">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/3">
          <h2 className="text-xs font-black tracking-widest text-sky-400 uppercase">
            🛒 {done ? 'PURCHASE COMPLETE' : 'CONFIRM PURCHASE'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          // Success state
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white mb-1">Transaction Confirmed</h3>
              <p className="text-xs text-slate-400">"{listing.title}" has been added to your purchases.</p>
            </div>
            {txData && (
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left space-y-2">
                <Row label="Amount Paid"   value={`$${txData.amount?.toFixed(2)}`}  color="text-white" />
                <Row label="Platform Fee (10%)" value={`$${txData.commission?.toFixed(2)}`} color="text-slate-500" small />
                <Row label="Seller Earns"  value={`$${txData.sellerPayout?.toFixed(2)}`} color="text-emerald-400" small />
              </div>
            )}
            <button onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all">
              DONE
            </button>
          </div>
        ) : (
          // Confirm state
          <div className="p-5 space-y-4">
            {/* Listing summary */}
            <div className="flex gap-3 p-3 bg-black/30 border border-white/5 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center text-xl">
                📐
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{listing.title}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">by {listing.seller_name}</p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-2.5">
              <p className="text-[9px] font-black text-slate-600 tracking-widest uppercase mb-3">Price Breakdown</p>
              <Row label="Listing Price"   value={`$${listing.price?.toFixed(2)}`} color="text-white" />
              <Row label="Platform Fee (10%)" value={`−$${commission}`} color="text-amber-400" small />
              <div className="border-t border-white/5 pt-2 mt-2">
                <Row label="Seller Receives" value={`$${sellerEarns}`} color="text-emerald-400" />
              </div>
              <div className="flex items-start gap-2 mt-3 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[9px] text-amber-400/80 leading-relaxed">
                  10% platform fee supports FABER.NET infrastructure and helps us keep building. You pay <strong className="text-amber-400">${listing.price?.toFixed(2)}</strong>.
                </p>
              </div>
            </div>

            {listing.file_type && (
              <div className="flex items-center gap-2 p-2 bg-sky-500/5 border border-sky-500/15 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <p className="text-[10px] text-sky-400">Instant file access — .{listing.file_type} included</p>
              </div>
            )}

            <button onClick={handleBuy} disabled={busy}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 py-3.5 rounded-xl font-black text-xs tracking-[0.15em] uppercase transition-all shadow-[0_0_20px_rgba(14,165,233,0.25)] flex items-center justify-center gap-2 accent-pulse">
              {busy ? 'PROCESSING...' : <><ShoppingBag className="w-4 h-4" />COMPLETE PURCHASE — ${listing.price?.toFixed(2)}</>}
            </button>
            <p className="text-[9px] text-slate-700 text-center">This deducts from your account balance.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, color, small }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${small ? 'text-[10px] text-slate-600' : 'text-xs font-bold text-slate-400'}`}>{label}</span>
      <span className={`font-black ${small ? 'text-xs' : 'text-sm'} ${color}`}>{value}</span>
    </div>
  );
}
