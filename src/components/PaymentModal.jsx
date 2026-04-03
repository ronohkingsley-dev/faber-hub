// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/PaymentModal.jsx
//  Stripe-ready payment form (mock mode for development)
//  To go live: replace handleSubmit with Stripe.js flow
// ══════════════════════════════════════════════════════
import { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

const COMMISSION_RATE = 0.10;

// Format card number with spaces
const fmtCard   = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0,4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };
const fmtCVV    = (v) => v.replace(/\D/g, '').slice(0, 4);

export default function PaymentModal({ listing, onClose, onPurchased }) {
  const { isDemo } = useAuth();
  const { push } = useToast();
  const [step, setStep]   = useState('card'); // 'card' | 'processing' | 'done'
  const [card, setCard]   = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [txData, setTxData] = useState(null);
  const [error, setError]  = useState('');

  const commission   = parseFloat((listing.price * COMMISSION_RATE).toFixed(2));
  const sellerEarns  = parseFloat((listing.price - commission).toFixed(2));

  const validate = () => {
    const num = card.number.replace(/\s/g, '');
    if (num.length < 16)    return 'Enter a valid 16-digit card number';
    if (!card.expiry.includes('/') || card.expiry.length < 5) return 'Enter valid expiry (MM/YY)';
    if (card.cvv.length < 3) return 'Enter a valid CVV';
    if (!card.name.trim())  return 'Enter the cardholder name';
    return null;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (isDemo) { push('Payment flows disabled for Demo roles. Please login natively.', 'warn'); return; }
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep('processing');

    // ─── MOCK MODE ── replace this block with Stripe.js for production ────────
    // In production:
    // 1. Call Stripe.createPaymentMethod() with card details
    // 2. POST paymentMethod.id to /api/market/:id/buy
    // 3. Backend creates PaymentIntent, confirms, records commission
    // ─────────────────────────────────────────────────────────────────────────
    try {
      await new Promise(r => setTimeout(r, 1800)); // simulate processing
      const { data } = await API.post(`/market/${listing.id}/buy`);
      setTxData(data.transaction);
      setStep('done');
      push(`Payment confirmed! "${listing.title}" is now yours.`, 'success');
      onPurchased?.(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      setStep('card');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && step !== 'processing' && onClose()}>
      <div className="bg-slate-900 border border-white/10 w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl modal-in overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-sky-900/20 to-slate-900/50">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-black tracking-widest text-sky-400 uppercase">Secure Checkout</h2>
          </div>
          {step !== 'processing' && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
          )}
        </div>

        {step === 'done' ? (
          /* ── SUCCESS ─────────────────────────────────────────────── */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Payment Confirmed!</h3>
              <p className="text-xs text-slate-400 mt-1">"{listing.title}" has been added to your purchases.</p>
            </div>
            {txData && (
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left space-y-2 text-xs">
                <Row label="Amount Charged"    value={`$${txData.amount?.toFixed(2)}`}       color="text-white" />
                <Row label="Platform Fee (10%)" value={`$${txData.commission?.toFixed(2)}`}  color="text-amber-400" />
                <Row label="Seller Receives"   value={`$${txData.sellerPayout?.toFixed(2)}`} color="text-emerald-400" />
              </div>
            )}
            <button onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all">
              DONE
            </button>
          </div>
        ) : step === 'processing' ? (
          /* ── PROCESSING ──────────────────────────────────────────── */
          <div className="p-10 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black text-white">Processing Payment...</p>
            <p className="text-xs text-slate-500">Do not close this window</p>
          </div>
        ) : (
          /* ── CARD FORM ───────────────────────────────────────────── */
          <form onSubmit={handlePay} className="p-5 space-y-4">
            {/* Order summary */}
            <div className="flex gap-3 p-3 bg-black/30 border border-white/5 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center text-lg flex-shrink-0">📐</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{listing.title}</p>
                <p className="text-[10px] text-slate-600">by {listing.seller_name}</p>
              </div>
              <p className="text-sm font-black text-emerald-400">${listing.price?.toFixed(2)}</p>
            </div>

            {/* Mock notice */}
            <div className="flex items-start gap-2 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-400/80 leading-relaxed">
                <strong className="text-amber-400">DEMO MODE</strong> — No real charges. Use any test card details. Production deployment requires Stripe integration.
              </p>
            </div>

            {/* Card fields */}
            <div className="space-y-3">
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                  placeholder="CARD NUMBER"
                  value={card.number}
                  onChange={e => setCard(c => ({ ...c, number: fmtCard(e.target.value) }))}
                  className="w-full bg-black/40 border border-white/5 pl-9 pr-3 py-3 rounded-xl text-xs font-bold text-white tracking-widest outline-none focus:border-sky-500 placeholder-slate-700 transition-all"
                  inputMode="numeric"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={e => setCard(c => ({ ...c, expiry: fmtExpiry(e.target.value) }))}
                  className="bg-black/40 border border-white/5 px-3 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-sky-500 placeholder-slate-700 transition-all"
                  inputMode="numeric"
                />
                <input
                  placeholder="CVV"
                  value={card.cvv}
                  onChange={e => setCard(c => ({ ...c, cvv: fmtCVV(e.target.value) }))}
                  type="password"
                  className="bg-black/40 border border-white/5 px-3 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-sky-500 placeholder-slate-700 transition-all"
                  inputMode="numeric"
                />
              </div>
              <input
                placeholder="CARDHOLDER NAME"
                value={card.name}
                onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                className="w-full bg-black/40 border border-white/5 px-3 py-3 rounded-xl text-xs font-bold text-white uppercase outline-none focus:border-sky-500 placeholder-slate-700 transition-all"
              />
            </div>

            {error && <p className="text-[10px] text-red-400 font-bold bg-red-500/5 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}

            {/* Breakdown */}
            <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 space-y-1.5">
              <Row label="Item Price"     value={`$${listing.price?.toFixed(2)}`}    color="text-white" />
              <Row label="Platform Fee"   value={`$${commission}`}                    color="text-slate-500" small />
              <Row label="Seller Earns"   value={`$${sellerEarns}`}                   color="text-emerald-400" small />
            </div>

            <button type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 py-3.5 rounded-xl font-black text-xs tracking-[0.15em] uppercase transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2 accent-pulse">
              <Lock className="w-3.5 h-3.5" />
              PAY ${listing.price?.toFixed(2)} SECURELY
            </button>

            <div className="flex items-center justify-center gap-2 text-[9px] text-slate-600">
              <Shield className="w-3 h-3" />
              <span>256-bit encrypted · Stripe-ready</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, color, small }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${small ? 'text-[9px] text-slate-600' : 'text-[10px] font-bold text-slate-400'}`}>{label}</span>
      <span className={`font-black ${small ? 'text-xs' : 'text-sm'} ${color}`}>{value}</span>
    </div>
  );
}
