// ══════════════════════════════════════════════════════
//  FABER.NET · src/pages/AuthPage.jsx
// ══════════════════════════════════════════════════════
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Zap, User, Mail, Lock, Cpu, ChevronRight } from 'lucide-react';

const DEPTS = ['Mechanical', 'Electrical', 'Civil', 'Computer', 'Chemical', 'Aerospace', 'Structural', 'Software'];

export default function AuthPage() {
  const [tab, setTab]   = useState('login');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', department:'Mechanical' });
  const { login, register, demoLogin } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        push('Welcome back, Engineer!', 'success');
        navigate('/feed');
      } else if (tab === 'reset') {
        if (!form.email.trim() || !form.password.trim()) { push('Email and new password required', 'error'); setBusy(false); return; }
        const { data } = await import('../api/client').then(m => m.default.post('/auth/reset-password', { email: form.email, newPassword: form.password }));
        push(data.message || 'Password reset successfully', 'success');
        setTab('login');
      } else if (tab === 'demo') {
        if (!form.email.trim()) { push('Email is required for demo', 'error'); setBusy(false); return; }
        await demoLogin(form.email);
        push('Demo Access Granted. Some features are restricted.', 'success');
        navigate('/feed');
      } else {
        if (!form.name.trim()) { push('Name is required', 'error'); setBusy(false); return; }
        await register(form.name, form.email, form.password, form.department);
        push('Account created! Welcome to FABER.NET', 'success');
        navigate('/feed');
      }
    } catch (err) {
      push(err.response?.data?.error || 'Authentication failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.06)_0%,_transparent_60%)]" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(14,165,233,0.15)]">
            <Zap className="text-sky-400 w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white">FABER.NET</h1>
          <p className="text-[10px] text-sky-400/60 font-bold tracking-[0.3em] mt-1">ENGINEER NETWORK</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm form-up">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

          {/* Tab switcher */}
          <div className="flex border-b border-white/5">
            {['login', 'register', 'demo', 'reset'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all
                  ${tab === t ? 'text-sky-400 bg-sky-500/5 border-b-2 border-sky-500' : 'text-slate-600 hover:text-slate-400'}`}>
                {t === 'login' ? '⚡ ACCESS' : t === 'demo' ? 'GUEST' : t === 'reset' ? '🔑 RESET' : '⊕ REGISTER'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="p-6 space-y-3">
            {tab === 'register' && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                  <input required placeholder="FULL NAME" value={form.name} onChange={e => set('name', e.target.value)}
                    className="w-full bg-black/40 border border-white/5 pl-9 pr-3 py-3 rounded-xl text-xs text-white outline-none focus:border-sky-500 placeholder-slate-300 transition-all" />
                </div>
                <div className="relative">
                  <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                  <select value={form.department} onChange={e => set('department', e.target.value)}
                    className="w-full bg-black/40 border border-white/5 pl-9 pr-3 py-3 rounded-xl text-xs text-sky-400 outline-none focus:border-sky-500 transition-all appearance-none">
                    {DEPTS.map(d => <option key={d} value={d}>{d} Engineering</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input type="email" required placeholder="EMAIL ADDRESS" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full bg-black/40 border border-white/5 pl-9 pr-3 py-3 rounded-xl text-xs text-white outline-none focus:border-sky-500 placeholder-slate-300 transition-all" />
            </div>
            {tab !== 'demo' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input type="password" required placeholder={tab === 'reset' ? 'NEW PASSWORD' : 'PASSWORD'} value={form.password} onChange={e => set('password', e.target.value)}
                  className="w-full bg-black/40 border border-white/5 pl-9 pr-3 py-3 rounded-xl text-xs text-white outline-none focus:border-sky-500 placeholder-slate-300 transition-all" />
              </div>
            )}

            <button type="submit" disabled={busy}
              className={`w-full hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-black text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 mt-2 ${tab === 'reset' ? 'bg-amber-600 shadow-[0_0_24px_rgba(217,119,6,0.3)]' : 'bg-sky-600 shadow-[0_0_24px_rgba(14,165,233,0.3)] accent-pulse'}`}>
              {busy ? <span className="dot-pulse">PROCESSING...</span> : <>
                {tab === 'login' ? 'ACCESS COMMAND CENTER' : tab === 'demo' ? 'START DEMO' : tab === 'reset' ? 'RESET PASSWORD' : 'JOIN THE NETWORK'}
                <ChevronRight className="w-3 h-3" />
              </>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
