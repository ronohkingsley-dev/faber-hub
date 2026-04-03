// ══════════════════════════════════════════════════════
//  FABER.NET · src/pages/TutorialsPage.jsx
// ══════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { BookOpen, Clock, Eye, Filter, Play, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import Archive from '../components/Archive';
import API from '../api/client';

const DEMO_TUTORIALS = [
  { id: 't1', title: 'Inventor 2024 — Constraint Toolkit', author_name: 'T. Lindström', department: 'Mechanical', duration: '28:14', views: 5420, category: 'CAD', description: 'Full walkthrough of Autodesk Inventor constraint types, degrees of freedom, and assembly mating.' },
  { id: 't2', title: 'ANSYS Structural — Mesh Refinement Tricks', author_name: 'K. Ronoh',      department: 'Civil',      duration: '45:02', views: 3901, category: 'FEA', description: 'Adaptive mesh refinement strategies for faster, more accurate stress results.' },
  { id: 't3', title: 'KiCad 7 — 4-Layer PCB Design', author_name: 'A. Oduya',      department: 'Electrical', duration: '1:02:30', views: 8122, category: 'PCB', description: 'Designing a high-speed 4-layer PCB. Covers stackup, impedance control, and via stitching.' },
  { id: 't4', title: 'FreeRTOS on STM32 — Task Scheduling', author_name: 'M. Patel',      department: 'Computer',   duration: '38:47', views: 4211, category: 'Embedded', description: 'Understanding RTOS task priorities, mutexes, and semaphores on STM32F4.' },
  { id: 't5', title: 'AutoCAD Civil 3D — Grading & Corridors', author_name: 'D. Mbeki',      department: 'Civil',      duration: '52:09', views: 2837, category: 'Civil 3D', description: 'Complete road design workflow with grading, alignment, and corridor modelling.' },
  { id: 't6', title: 'Python for Engineers — Pandas + NumPy', author_name: 'K. Ronoh',      department: 'Computer',   duration: '41:33', views: 6789, category: 'Code', description: 'Data analysis for engineers: processing sensor data, plotting, and regression.' },
];

const CATS = ['All', 'CAD', 'FEA', 'PCB', 'Embedded', 'Code', 'Civil 3D'];
const DEPT_COLOR = { Mechanical: 'sky', Electrical: 'amber', Civil: 'emerald', Computer: 'violet', Chemical: 'orange', Aerospace: 'rose' };

export default function TutorialsPage() {
  const { push } = useToast();
  const [tutorials, setTutorials] = useState([]);
  const [cat, setCat]             = useState('All');
  const [loading, setLoading]     = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    setLoading(true);
    API.get('/tutorials', { params: { category: cat === 'All' ? undefined : cat, limit: 24 } })
      .then(r => setTutorials(r.data.length > 0 ? r.data : DEMO_TUTORIALS))
      .catch(() => setTutorials(DEMO_TUTORIALS))
      .finally(() => setLoading(false));
  }, [cat]);

  const filtered = cat === 'All' ? tutorials : tutorials.filter(t => t.category === cat);

  return (
    <div className="min-h-screen bg-slate-950 pt-16 pb-20 md:pb-4">
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-4 flex items-center gap-3">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-widest">Engineering Tutorials</h1>
            <p className="text-[10px] text-slate-600">Learn from senior engineers</p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-14 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-2">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto scrollbar-hide">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex-shrink-0 text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg transition-all
                ${cat === c ? 'bg-sky-500/15 text-sky-400' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-white/5 rounded-2xl h-56 animate-pulse" />
          ))
        ) : filtered.map(t => {
          const col = DEPT_COLOR[t.department] || 'sky';
          return (
            <div key={t.id} onClick={() => setActiveVideo(t)} className="group bg-slate-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:shadow-2xl transition-all cursor-pointer">
              {/* Thumbnail placeholder */}
              <div className={`h-36 relative flex items-center justify-center`}
                style={{ background: `linear-gradient(135deg, #0a0a0f 0%, rgba(14,165,233,0.06) 100%)` }}>
                <div className="absolute inset-0 scanlines opacity-20" />
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110`}
                  style={{ background: `rgba(14,165,233,0.08)`, borderColor: `rgba(14,165,233,0.25)` }}>
                  <Play className="w-6 h-6 text-sky-400 ml-0.5" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />{t.duration}
                </div>
                <div className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-md bg-${col}-500/15 text-${col}-400 tracking-widest`}>
                  {t.category}
                </div>
              </div>

              <div className="p-3">
                <h3 className="text-xs font-black text-white leading-tight mb-1.5 line-clamp-2 group-hover:text-sky-300 transition-colors">{t.title}</h3>
                <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2 mb-3">{t.description}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md bg-${col}-500/10 border border-${col}-500/20 flex items-center justify-center text-[9px] font-black text-${col}-400`}>
                    {(t.author_name || 'F')[0]}
                  </div>
                  <p className={`text-[10px] font-bold text-${col}-400`}>{t.author_name}</p>
                  <div className="flex items-center gap-1 ml-auto text-slate-600">
                    <Eye className="w-3 h-3" />
                    <span className="text-[9px] font-bold">{(t.views || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            <button onClick={() => setActiveVideo(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white transition-all backdrop-blur-md">
              <X className="w-5 h-5" />
            </button>
            <div className="p-4 border-b border-white/5">
              <h2 className="text-white font-black text-lg">{activeVideo.title}</h2>
              <p className="text-sky-400 text-xs font-bold">{activeVideo.author_name}</p>
            </div>
            <div className="p-4">
              <Archive youtubeId={activeVideo.youtube_id || '9bZkp7q19f0'} title={activeVideo.title} />
              <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5 text-sm text-slate-300">
                {activeVideo.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
