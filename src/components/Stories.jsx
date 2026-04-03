// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/Stories.jsx
// ══════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { Plus, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

export default function Stories() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [viewed, setViewed] = useState(new Set());

  useEffect(() => {
    API.get('/stories').then(r => setStories(r.data)).catch(() => {});
  }, []);

  // real stories only
  const displayStories = stories;

  const colorMap = { Mechanical: 'sky', Electrical: 'amber', Civil: 'emerald', Computer: 'violet', Chemical: 'orange', Aerospace: 'rose', Structural: 'teal', Software: 'blue' };
  const getColor = (dept) => colorMap[dept] || 'sky';

  return (
    <div className="flex gap-3 px-4 pb-2 overflow-x-auto scrollbar-hide">
      {/* Add Story */}
      <button className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border-2 border-sky-500/30 border-dashed flex items-center justify-center group-hover:border-sky-500/60 transition-all">
          <Plus className="w-5 h-5 text-sky-400" />
        </div>
        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wide">YOUR<br/>STORY</span>
      </button>

      {/* Story items */}
      {displayStories.map(s => {
        const col = getColor(s.department);
        const isViewed = viewed.has(s.id);
        return (
          <button key={s.id} onClick={() => setViewed(v => new Set([...v, s.id]))}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
            <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all
              ${isViewed ? 'border-slate-700 opacity-50' : `border-${col}-500/60 shadow-[0_0_12px_rgba(14,165,233,0.2)] group-hover:shadow-[0_0_20px_rgba(14,165,233,0.35)]`}`}
              style={{ background: `linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(99,102,241,0.1) 100%)` }}>
              <span className={`text-lg font-black text-${col}-400`}>{(s.author_name || '?')[0]}</span>
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide text-center max-w-14 leading-tight truncate">
              {(s.author_name || '').split(' ')[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
