// ══════════════════════════════════════════════════════
//  FABER.NET · src/pages/ProfilePage.jsx
// ══════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { User, Zap, TrendingUp, ShoppingBag, FileCode, DollarSign, Package } from 'lucide-react';
import PostCard from '../components/PostCard';
import MarketCard from '../components/MarketCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../api/client';

const TABS = ['POSTS', 'LISTINGS', 'PURCHASES'];
const DEPT_COLORS = { Mechanical:'sky', Electrical:'amber', Civil:'emerald', Computer:'violet', Chemical:'orange', Aerospace:'rose' };

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { push } = useToast();
  const [tab, setTab]           = useState('POSTS');
  const [profile, setProfile]   = useState(null);
  const [posts, setPosts]       = useState([]);
  const [listings, setListings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      API.get(`/users/${user.id}`),
      API.get('/posts', { params: { limit: 50 } }),
      API.get('/market/my-listings'),
      API.get('/market/my-purchases'),
    ]).then(([prof, postsRes, listRes, purchRes]) => {
      setProfile(prof.data);
      setPosts(postsRes.data.filter(p => p.author_id === user.id || p.author_name === user.name));
      setListings(listRes.data);
      setPurchases(purchRes.data);
    }).catch(() => push('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">NOT AUTHENTICATED</div>;

  const col = DEPT_COLORS[user.department] || 'sky';
  const totalRevenue = listings.reduce((s, l) => s + (l.revenue || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 pt-16 pb-20 md:pb-4">
      {/* Profile header */}
      <div className="border-b border-white/5 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-20 h-20 rounded-2xl bg-${col}-500/10 border-2 border-${col}-500/30 flex items-center justify-center text-3xl font-black text-${col}-400 flex-shrink-0`}>
              {(user.name || 'F')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white">{user.name}</h1>
              <p className={`text-sm font-bold text-${col}-400 mb-1`}>{user.department} Engineer</p>
              <p className="text-[10px] font-mono text-slate-600">{user.node_id}</p>
              {profile?.bio && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{profile.bio}</p>}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: FileCode, label: 'Posts',     value: profile?.postCount    || posts.length },
              { icon: Package,  label: 'Listings',  value: profile?.listingCount || listings.length },
              { icon: ShoppingBag, label: 'Bought', value: purchases.length },
              { icon: DollarSign,  label: 'Earned', value: `$${(profile?.revenue || totalRevenue).toFixed(0)}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-900 border border-white/5 rounded-xl p-3 text-center">
                <Icon className="w-3.5 h-3.5 text-sky-400 mx-auto mb-1.5" />
                <p className="text-sm font-black text-white">{value}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-4">
        <div className="max-w-3xl mx-auto flex gap-1 py-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg transition-all
                ${tab === t ? 'bg-sky-500/15 text-sky-400' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'POSTS' ? (
          <div className="space-y-4">
            {posts.length === 0
              ? <p className="text-center text-slate-600 text-xs py-12 font-bold">NO POSTS YET</p>
              : posts.map(p => <PostCard key={p.id} post={p} />)}
          </div>
        ) : tab === 'LISTINGS' ? (
          <div>
            {listings.length > 0 && (
              <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-black text-emerald-400">Total Revenue Earned</p>
                  <p className="text-[10px] text-slate-500">After 10% platform commission</p>
                </div>
                <p className="ml-auto text-lg font-black text-emerald-400">${totalRevenue.toFixed(2)}</p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {listings.length === 0
                ? <p className="col-span-3 text-center text-slate-600 text-xs py-12 font-bold">NO LISTINGS YET</p>
                : listings.map(l => (
                    <MarketCard 
                      key={l.id} 
                      listing={l} 
                      isOwner={true}
                      onEdit={() => push('Editing coming soon', 'info')}
                      onDelete={async () => {
                        if (confirm('Are you sure you want to delete this listing?')) {
                          try {
                            await API.delete(`/market/${l.id}`);
                            setListings(prev => prev.filter(x => x.id !== l.id));
                            push('Listing removed', 'success');
                          } catch (err) { push('Failed to delete', 'error'); }
                        }
                      }}
                    />
                  ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.length === 0
              ? <p className="text-center text-slate-600 text-xs py-12 font-bold">NO PURCHASES YET</p>
              : purchases.map(p => (
                <div key={p.id} className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-xl flex-shrink-0">📐</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-600">from {p.seller_name} · .{p.file_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-400 mb-1">${p.amount?.toFixed(2)}</p>
                    {p.file_url ? (
                      <a download href={p.file_url} className="text-[9px] bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg font-bold hover:bg-sky-500/30 transition-all cursor-pointer">
                        DOWNLOAD
                      </a>
                    ) : (
                      <span className="text-[9px] text-slate-500 uppercase">NO FILE AVAILABLE</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
