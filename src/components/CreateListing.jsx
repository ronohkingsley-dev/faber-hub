// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/CreateListing.jsx
//  File upload REQUIRED · Demo video optional
// ══════════════════════════════════════════════════════
import { useState } from 'react';
import { X, Upload, Tag, Info, Video, CheckCircle, FileCode } from 'lucide-react';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import API, { BACKEND_URL } from '../api/client';

const CATEGORIES = [
  { value: 'drawing',     label: '📐 Drawing / DXF / DWG' },
  { value: '3d_model',    label: '🖥️ 3D Model / CAD / GLB' },
  { value: 'schematic',   label: '⚡ Schematic / PCB' },
  { value: 'source_code', label: '💻 Source Code' },
  { value: 'report',      label: '📄 Report / Analysis' },
  { value: 'other',       label: '📦 Other' },
];

export default function CreateListing({ onClose, onCreated }) {
  const { isDemo } = useAuth();
  const { push } = useToast();
  const [form, setForm]     = useState({ title: '', description: '', category: 'drawing', price: '', tags: '', duration: '0' });
  const [file, setFile]     = useState(null);       // REQUIRED
  const [video, setVideo]   = useState(null);       // optional demo video
  const [busy, setBusy]     = useState(false);
  const [step, setStep]     = useState(1);          // 1=details, 2=files

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const commission = form.price ? (parseFloat(form.price) * 0.10).toFixed(2) : null;
  const earns      = form.price ? (parseFloat(form.price) * 0.90).toFixed(2) : null;

  const canContinue = form.title.trim() && form.description.trim() && parseFloat(form.price) > 0;
  const canSubmit   = canContinue && file;

  const uploadFile = async (f, type) => {
    const formData = new FormData();
    formData.append('file', f);
    const { data } = await API.post(`/upload?type=${type}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return { url: BACKEND_URL + data.url };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) { push('Demo accounts cannot launch marketplace listings. Please register natively.', 'warn'); return; }
    if (!file) { push('A design file is required to list', 'warn'); return; }
    if (!canSubmit) { push('Please complete all required fields', 'warn'); return; }
    setBusy(true);
    try {
      let file_url = null, file_type = null, demo_video_url = null;

      // Upload main file
      const up = await uploadFile(file, 'market');
      file_url  = up.url;
      file_type = file.name.split('.').pop().toLowerCase();

      // Upload optional demo video
      if (video) {
        const vu = await uploadFile(video, 'market');
        demo_video_url = vu.url;
      }

      const { data } = await API.post('/market', {
        ...form,
        price: parseFloat(form.price),
        file_url, file_type, demo_video_url,
      });
      push('Listing published to the marketplace!', 'success');
      onCreated?.(data);
      onClose();
    } catch (err) {
      push(err.response?.data?.error || 'Failed to create listing', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && !busy && onClose()}>
      <div className="bg-slate-900 border border-white/10 w-full md:max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl modal-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/3 flex-shrink-0">
          <div>
            <h2 className="text-xs font-black tracking-widest text-sky-400 uppercase">📦 List on Marketplace</h2>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2].map(s => (
                <div key={s} className={`h-0.5 w-8 rounded transition-all ${step >= s ? 'bg-sky-500' : 'bg-white/10'}`} />
              ))}
              <span className="text-[9px] text-slate-600 ml-1">Step {step}/2</span>
            </div>
          </div>
          {!busy && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>}
        </div>

        <div className="overflow-y-auto flex-1">
          {step === 1 ? (
            /* ── STEP 1: DETAILS ────────────────────────────────── */
            <div className="p-5 space-y-3">
              <input required placeholder="LISTING TITLE *" value={form.title} onChange={e => set('title', e.target.value)}
                className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-xs font-bold text-white outline-none focus:border-sky-500 placeholder-slate-700 transition-all" />

              <textarea required placeholder="DESCRIPTION — what's included? Who is it for? *"
                className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-xs text-slate-300 h-24 sm:h-28 outline-none focus:border-sky-500 placeholder-slate-700 resize-none transition-all"
                value={form.description} onChange={e => set('description', e.target.value)} />

              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] font-bold text-sky-400 outline-none appearance-none">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                  <input type="number" required min="0.01" step="0.01" placeholder="PRICE (USD) *" value={form.price}
                    onChange={e => set('price', e.target.value)}
                    className="w-full bg-black/40 border border-white/5 pl-9 pr-3 py-3 rounded-xl text-xs font-black text-emerald-400 outline-none focus:border-emerald-500 placeholder-slate-700 transition-all" />
                </div>
                <input placeholder="TAGS (comma-sep)" value={form.tags} onChange={e => set('tags', e.target.value)}
                  className="bg-black/40 border border-white/5 p-3 rounded-xl text-xs text-slate-400 outline-none focus:border-sky-500 placeholder-slate-700 transition-all" />

                <select value={form.duration} onChange={e => set('duration', e.target.value)}
                  className="col-span-2 w-full bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] font-bold text-slate-300 outline-none appearance-none mt-1">
                  <option value="0">⏳ LIFETIME (Never Expires)</option>
                  <option value="1">⏱️ 1 HOUR TEMPORARY</option>
                  <option value="24">⏱️ 24 HOURS TEMPORARY</option>
                  <option value="168">⏱️ 7 DAYS TEMPORARY</option>
                </select>
              </div>

              {/* Revenue preview */}
              {commission && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info className="w-3 h-3 text-amber-400" />
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Your Revenue</p>
                  </div>
                  <div className="flex justify-between text-[10px]"><span className="text-slate-500">Listing Price</span><span className="font-black text-white">${parseFloat(form.price || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-slate-500">Platform Fee (10%)</span><span className="font-black text-amber-400">−${commission}</span></div>
                  <div className="flex justify-between text-[10px] pt-1 border-t border-white/5"><span className="text-slate-300 font-bold">You Receive</span><span className="font-black text-emerald-400">${earns}</span></div>
                </div>
              )}

              <button onClick={() => canContinue && setStep(2)} disabled={!canContinue}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all">
                NEXT: ATTACH FILES →
              </button>
            </div>
          ) : (
            /* ── STEP 2: FILES ──────────────────────────────────── */
            <div className="p-5 space-y-4">
              {/* Required file */}
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />DESIGN FILE <span className="text-red-400">*</span> <span className="text-slate-600 font-normal">(required)</span>
                </p>
                <label className={`flex items-center justify-center gap-2 border-2 border-dashed p-4 rounded-xl cursor-pointer transition-all
                  ${file ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50' : 'bg-black/30 border-white/10 hover:border-sky-500/40'}`}>
                  {file ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <div className="text-left">
                        <p className="text-xs font-black">{file.name}</p>
                        <p className="text-[9px] opacity-70">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-sky-400" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-white">Click to attach design file</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">DWG, DXF, IPT, IAM, GLB, GLTF, PDF, STEP, KiCad, ZIP...</p>
                      </div>
                    </>
                  )}
                  <input type="file" className="hidden"
                    accept=".dwg,.dxf,.ipt,.iam,.glb,.gltf,.step,.stp,.igs,.pdf,.kicad_pro,.sch,.brd,.zip,.rar,.xlsx,.csv,.py,.js,.cpp,.h"
                    onChange={e => setFile(e.target.files[0])} />
                </label>
                {file && (
                  <button type="button" onClick={() => setFile(null)} className="text-[9px] text-slate-600 hover:text-red-400 mt-1 transition-colors">
                    ✕ Remove file
                  </button>
                )}
              </div>

              {/* Optional demo video */}
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-violet-400" />DEMO VIDEO <span className="text-slate-600 font-normal">(optional — highly recommended)</span>
                </p>
                <label className={`flex items-center justify-center gap-2 border-2 border-dashed p-4 rounded-xl cursor-pointer transition-all
                  ${video ? 'bg-violet-500/5 border-violet-500/30 hover:border-violet-500/50' : 'bg-black/30 border-white/10 hover:border-violet-500/30'}`}>
                  {video ? (
                    <div className="flex items-center gap-2 text-violet-400">
                      <Video className="w-4 h-4" />
                      <div className="text-left">
                        <p className="text-xs font-black">{video.name}</p>
                        <p className="text-[9px] opacity-70">{(video.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Video className="w-4 h-4 text-violet-400" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-white">Attach a short walkthrough video</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">MP4, MOV, WEBM · max 100MB · boosts listing appeal</p>
                      </div>
                    </>
                  )}
                  <input type="file" className="hidden" accept=".mp4,.mov,.webm"
                    onChange={e => setVideo(e.target.files[0])} />
                </label>
                {video && (
                  <button type="button" onClick={() => setVideo(null)} className="text-[9px] text-slate-600 hover:text-red-400 mt-1 transition-colors">
                    ✕ Remove video
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 border border-white/10 hover:bg-white/5 py-3 rounded-xl font-black text-xs uppercase transition-all text-slate-400">
                  ← BACK
                </button>
                <button onClick={handleSubmit} disabled={busy || !file}
                  className="flex-2 flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-1.5">
                  {busy ? 'UPLOADING...' : '⚡ PUBLISH LISTING'}
                </button>
              </div>

              {!file && <p className="text-[9px] text-red-400/70 text-center font-bold">A design file is required to publish</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
