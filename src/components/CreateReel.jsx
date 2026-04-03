import { useState, useEffect } from 'react';
import { X, Play, Upload, ShoppingBag } from 'lucide-react';
import API from '../api/client';
import { useToast } from './Toast';

export default function CreateReel({ onClose, onCreated }) {
  const { push } = useToast();
  const [form, setForm] = useState({ title: '', description: '', intent: 'standard', listing_id: '', videoFile: null });
  const [busy, setBusy] = useState(false);
  const [myListings, setMyListings] = useState([]);

  useEffect(() => {
    API.get('/market/my-listings').then(r => setMyListings(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return push('Title required', 'error');
    if (!form.videoFile) return push('Please select a video file', 'error');
    if (form.intent === 'market' && !form.listing_id) return push('Please select a marketplace product to link', 'error');
    
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', form.videoFile);
      const uploadRes = await API.post('/upload?type=reel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { data } = await API.post('/reels', {
        title: form.title,
        description: form.description,
        video_url: (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000') + uploadRes.data.url, // Full absolute path for static streaming
        listing_id: form.intent === 'market' ? form.listing_id : null,
      });
      push('Reel published successfully!', 'success');
      onCreated(data);
    } catch {
      push('Failed to publish reel', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border-t sm:border border-white/10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden slide-up">
        
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-sky-400" />
            UPLOAD REEL
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-full"><X className="w-4 h-4"/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Reel Title</label>
             <input autoFocus value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 outline-none focus:border-sky-500/50" placeholder="E.g., CNC Milling Timelapse" />
          </div>

          <div>
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Video File</label>
             <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e=>setForm({...form, videoFile: e.target.files[0]})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-sky-500/20 file:text-sky-400 hover:file:bg-sky-500/30" />
          </div>

          <div>
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Description (Optional)</label>
             <textarea rows="2" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-700 outline-none focus:border-sky-500/50 resize-none" placeholder="Add specs or details..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Intent / Action</label>
               <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm({...form, intent: 'standard'})} className={`py-2 rounded-xl text-xs font-black transition-all ${form.intent === 'standard' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-500 border border-transparent hover:bg-slate-700'}`}>STANDARD</button>
                  <button type="button" onClick={() => setForm({...form, intent: 'market'})} className={`py-2 rounded-xl text-xs font-black transition-all ${form.intent === 'market' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-transparent hover:bg-slate-700'}`}>SELL PRODUCT</button>
               </div>
             </div>
             <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Visibility</label>
               <select value={form.privacy || 'public'} onChange={e => setForm({...form, privacy: e.target.value})} className="w-full py-2.5 px-3 bg-black/40 border border-white/5 rounded-xl text-xs font-black text-amber-400 outline-none">
                  <option value="public">🌍 PUBLIC</option>
                  <option value="private">🔒 PRIVATE</option>
               </select>
             </div>
          </div>

          {form.intent === 'market' && (
             <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl animate-fade-in">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> Select Product to Promote</label>
                {myListings.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">You don't have any products in the marketplace yet.</p>
                ) : (
                  <div className="space-y-1">
                    {myListings.map(l => (
                      <button type="button" key={l.id} onClick={() => setForm({...form, listing_id: l.id})}
                         className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all border ${form.listing_id === l.id ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-black/40'}`}>
                         {l.title} <span className="text-emerald-400/50 float-right">${l.price}</span>
                      </button>
                    ))}
                  </div>
                )}
             </div>
          )}

          <div className="pt-4 border-t border-white/5">
             <button disabled={busy} type="submit" className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-xl transition-all flex justify-center items-center gap-2">
                {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Upload className="w-4 h-4"/> PUBLISH REEL</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
