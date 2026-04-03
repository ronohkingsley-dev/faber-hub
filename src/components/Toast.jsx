// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/Toast.jsx
// ══════════════════════════════════════════════════════
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error:   <XCircle    className="w-4 h-4 text-red-400" />,
  warn:    <AlertTriangle className="w-4 h-4 text-amber-400" />,
  info:    <Info       className="w-4 h-4 text-sky-400" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-xs">
        {toasts.map(t => (
          <div key={t.id} className="toast-in flex items-start gap-3 bg-slate-800 border border-white/10 rounded-xl p-3 shadow-2xl">
            {ICONS[t.type] || ICONS.info}
            <p className="text-xs text-slate-200 flex-1 font-mono leading-relaxed">{t.msg}</p>
            <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-white mt-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
