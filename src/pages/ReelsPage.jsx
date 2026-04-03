// ══════════════════════════════════════════════════════
//  FABER.NET · src/pages/ReelsPage.jsx
// ══════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { ThumbsUp, MessageSquare, Share2, Play, Volume2, VolumeX, Pause, Zap } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import CreateReel from '../components/CreateReel';
import API from '../api/client';


const DEPT_COLORS = { Mechanical: '#38bdf8', Electrical: '#fbbf24', Civil: '#34d399', Computer: '#818cf8', Chemical: '#fb923c', Aerospace: '#f472b6' };

export default function ReelsPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [reels, setReels]   = useState([]);
  const [myReels, setMyReels] = useState([]);
  const [tab, setTab]       = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [current, setCurrent] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    API.get('/reels').then(r => setReels(r.data)).catch(() => {});
    if (user) API.get('/reels/my-reels').then(r => setMyReels(r.data)).catch(() => {});
  }, [user]);

  const handleLike = async (id) => {
    try {
      const { data } = await API.post(`/reels/${id}/like`);
      setReels(prev => prev.map(r => r.id === id ? { ...r, likes: data.likes, liked_by: data.liked_by } : r));
      setMyReels(prev => prev.map(r => r.id === id ? { ...r, likes: data.likes, liked_by: data.liked_by } : r));
    } catch { push('Like failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reel?')) return;
    try {
      await API.delete(`/reels/${id}`);
      setReels(prev => prev.filter(r => r.id !== id));
      setMyReels(prev => prev.filter(r => r.id !== id));
      push('Reel deleted', 'success');
    } catch { push('Failed to delete', 'error'); }
  };

  const activeReels = tab === 'MINE' ? myReels : reels;

  return (
    <div className="fixed inset-0 bg-black pt-14 md:pt-14 pb-16 md:pb-0 overflow-hidden">
      {/* Top Floating Tab */}
      {user && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex bg-white/10 backdrop-blur-md rounded-xl p-1 shadow-lg">
          <button onClick={() => setTab('ALL')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${tab === 'ALL' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>ALL MEDIA</button>
          <button onClick={() => setTab('MINE')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${tab === 'MINE' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>YOUR MEDIA</button>
        </div>
      )}

      <div ref={containerRef} className="h-full reels-scroll overflow-y-scroll snap-y snap-mandatory">
        {activeReels.map((reel, idx) => (
          <ReelCard key={reel.id} reel={reel} isActive={idx === current} user={user}
            onVisible={() => setCurrent(idx)}
            onLike={() => handleLike(reel.id)}
            onDelete={tab === 'MINE' ? () => handleDelete(reel.id) : undefined}
            accentColor={DEPT_COLORS[reel.department] || '#38bdf8'}
          />
        ))}
        {activeReels.length === 0 && (
          <div className="h-screen flex items-center justify-center snap-start">
            <p className="text-slate-500 font-bold tracking-widest text-xs">NO REELS AVAILABLE</p>
          </div>
        )}
      </div>

      {user && (
        <button onClick={() => setShowCreate(true)}
          className="fixed bottom-24 right-6 md:bottom-8 w-12 h-12 bg-sky-600 hover:bg-sky-500 rounded-2xl flex items-center justify-center shadow-[0_0_24px_rgba(14,165,233,0.4)] transition-all hover:scale-110 z-50">
          <div className="text-2xl font-black text-white">+</div>
        </button>
      )}

      {showCreate && <CreateReel onClose={() => setShowCreate(false)} onCreated={(r) => { setReels([r, ...reels]); setMyReels([r, ...myReels]); setShowCreate(false); }} />}
    </div>
  );
}

function ReelCard({ reel, isActive, onVisible, onLike, onDelete, accentColor, user }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [localLiked, setLocalLiked] = useState(reel.liked_by?.includes(user?.id) || false);
  const [localLikes, setLocalLikes] = useState(reel.likes || 0);

  // Sync with global source of truth if it updates
  useEffect(() => {
    setLocalLiked(reel.liked_by?.includes(user?.id) || false);
    setLocalLikes(reel.likes || 0);
  }, [reel.likes, reel.liked_by, user?.id]);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) onVisible(); }, { threshold: 0.6 });
    if (cardRef.current) obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, [onVisible]);

  useEffect(() => {
    setIsPlaying(isActive);
    if(videoRef.current) {
        if(isActive) {
           videoRef.current.play().catch(() => {});
        } else {
           videoRef.current.pause();
        }
    }
  }, [isActive]);

  const togglePlay = () => {
    if(!videoRef.current) return;
    if(isPlaying) {
       videoRef.current.pause();
       setIsPlaying(false);
    } else {
       videoRef.current.play().catch(()=>{});
       setIsPlaying(true);
    }
  };

  const handleOptimisticLike = () => {
    const nextState = !localLiked;
    setLocalLiked(nextState);
    setLocalLikes(prev => nextState ? prev + 1 : Math.max(0, prev - 1));
    onLike(); // Fire to backend globally
  };

  return (
    <div ref={cardRef} className="reel-item h-screen relative flex items-end">
      <div className="absolute inset-0 cursor-pointer" onClick={togglePlay} onDoubleClick={(e) => { 
        e.stopPropagation(); 
        if(!localLiked) handleOptimisticLike();
      }} style={{
        background: `linear-gradient(135deg, #050507 0%, #0d0d14 40%, ${accentColor}08 100%)`,
      }}>
        {reel.video_url ? (
          <video ref={videoRef} src={reel.video_url} className="w-full h-full object-cover opacity-80" loop playsInline preload="none" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: `${accentColor}40`, background: `${accentColor}08` }}>
              <Play className="w-8 h-8 ml-1" style={{ color: accentColor }} />
            </div>
          </div>
        )}
        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
        
        {/* Play/Pause explicit big center icon on pause */}
        {!isPlaying && reel.video_url && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
               <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                 <Play className="w-8 h-8 text-white ml-2" />
               </div>
            </div>
        )}
      </div>

      {/* Author badge — top left */}
      <div className="absolute top-6 left-4 flex items-center gap-2 z-10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black border"
          style={{ background: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}>
          {(reel.author_name || 'F')[0]}
        </div>
        <div>
          <p className="text-xs font-black text-white">{reel.author_name}</p>
          <p className="text-[9px] font-mono" style={{ color: accentColor }}>{reel.department?.toUpperCase()}</p>
        </div>
      </div>

      {/* Right action bar */}
      <div className="absolute right-4 bottom-32 md:bottom-24 flex flex-col items-center gap-5 z-10">
        {onDelete ? (
           <button onClick={onDelete} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 hover:bg-red-500/40 flex items-center justify-center transition-all">
              <span className="text-[10px] font-black text-red-400">DEL</span>
            </div>
           </button>
        ) : (
          <button onClick={handleOptimisticLike} className="flex flex-col items-center gap-1 group z-50 pointer-events-auto relative">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all
              ${localLiked ? 'bg-sky-500/20 border-sky-500/40' : 'bg-white/5 border-white/10 group-hover:border-white/20'}`}>
              <ThumbsUp className={`w-5 h-5 transition-all ${localLiked ? 'fill-sky-400 text-sky-400' : 'text-white'}`} />
            </div>
            <span className="text-[9px] font-bold text-white/70">{localLikes}</span>
          </button>
        )}
        <button className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-[9px] font-bold text-white/70">{reel.views || 0}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[9px] font-bold text-white/70">SHARE</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="relative z-10 w-full px-4 pb-8 md:pb-6" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', paddingTop: '80px' }}>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3 h-3" style={{ color: accentColor }} />
          <span className="text-[9px] font-black tracking-widest" style={{ color: accentColor }}>
            {reel.department?.toUpperCase()} REEL
          </span>
          <span className="text-[9px] text-white/40 ml-auto">{reel.views?.toLocaleString()} views</span>
        </div>
        <h2 className="text-sm font-black text-white leading-tight mb-1">{reel.title}</h2>
        <p className="text-xs text-white/60 leading-relaxed line-clamp-2">{reel.description}</p>
        
        {reel.listing_id && (
           <a href={`/market`} className="mt-3 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all cursor-pointer">
              🛍️ AVAILABLE IN MARKETPLACE
           </a>
        )}
      </div>
    </div>
  );
}
