// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/CreatePost.jsx
// ══════════════════════════════════════════════════════
import { useState } from 'react';
import { X, Upload, FileCode, Send } from 'lucide-react';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import API, { BACKEND_URL } from '../api/client';

const POST_TYPES = [
  { value: 'blog',     label: '📝 BLOG / ANALYSIS' },
  { value: 'spec',     label: '📄 SPEC / PDF PACKAGE' },
  { value: 'render',   label: '🖼️ 3D RENDER' },
  { value: 'fieldlog', label: '🔧 FIELD LOG' },
];

export default function CreatePost({ onClose, onCreated, postToEdit, onUpdated }) {
  const { isDemo } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState({ 
    title: postToEdit?.title || '', 
    body: postToEdit?.body || '', 
    type: postToEdit?.type || 'blog',
    privacy: postToEdit?.privacy || 'public'
  });
  const [file, setFile]       = useState(null);
  const [busy, setBusy]       = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) { push('Demo accounts cannot create posts. Register a full account!', 'warn'); return; }
    if (!form.title.trim() || !form.body.trim()) { push('Title and body required', 'warn'); return; }
    setBusy(true);
    try {
      let file_url = null, file_name = null, file_type = null;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await API.post('/upload?type=post', formData, { headers:{'Content-Type':'multipart/form-data'} });
        file_url = BACKEND_URL + res.data.url;
        file_name = file.name;
        file_type = file.name.split('.').pop();
      }

      if (postToEdit) {
        const { data } = await API.put(`/posts/${postToEdit.id}`, { ...form });
        push('Post updated!', 'success');
        onUpdated?.(data);
      } else {
        const { data } = await API.post('/posts', { ...form, file_url, file_name, file_type });
        push('Post deployed to the network!', 'success');
        onCreated?.(data);
      }
      onClose();
    } catch (err) {
      push(err.response?.data?.error || 'Failed to create post', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-white/10 w-full md:max-w-lg rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl modal-in">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/3">
          <h2 className="text-xs font-black tracking-widest text-sky-400 uppercase">⚡ System Ingress // New Post</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <input required placeholder="PROJECT TITLE" value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-xs font-bold text-white outline-none focus:border-sky-500 placeholder-slate-700 transition-all" />
            
          <input placeholder="TAG USERS (e.g. @kingsley, @sarah)" value={form.mentions || ''} onChange={e => set('mentions', e.target.value)}
            className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-xs font-bold text-sky-400 outline-none focus:border-sky-500 placeholder-slate-700 transition-all font-mono" />
            
          <textarea required placeholder="TECHNICAL ANALYSIS / SPECS / FIELD NOTES..."
            className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-xs text-slate-300 h-28 outline-none focus:border-sky-500 placeholder-slate-700 resize-none transition-all"
            value={form.body} onChange={e => set('body', e.target.value)} />

          <div className="grid grid-cols-3 gap-3">
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] font-bold text-sky-400 outline-none appearance-none cursor-pointer">
              {POST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            <select value={form.privacy} onChange={e => set('privacy', e.target.value)}
              className="bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] font-bold text-amber-400 outline-none appearance-none cursor-pointer">
              <option value="public">🌍 PUBLIC (ALL)</option>
              <option value="private">🔒 PRIVATE (FRIENDS)</option>
            </select>

            <label className="flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-800 border border-white/5 hover:border-sky-500/30 p-3 rounded-xl cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] font-bold text-slate-300">ATTACH FILE</span>
              <input type="file" className="hidden" accept=".dwg,.dxf,.ipt,.iam,.pdf,.png,.jpg,.jpeg,.step,.sch,.zip,.mp4,.mov,.webm"
                onChange={e => setFile(e.target.files[0])} />
            </label>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-[10px] text-emerald-400 font-bold uppercase truncate">{file.name}</p>
              <button type="button" onClick={() => setFile(null)} className="ml-auto text-slate-600 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button type="submit" disabled={busy}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 py-3.5 rounded-xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(14,165,233,0.25)] flex items-center justify-center gap-2 mt-1">
            {busy ? 'DEPLOYING...' : <><Send className="w-3.5 h-3.5" />DEPLOY TO NETWORK</>}
          </button>
        </form>
      </div>
    </div>
  );
}
