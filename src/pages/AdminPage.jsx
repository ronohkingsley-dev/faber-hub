// ══════════════════════════════════════════════════════
//  FABER.NET · src/pages/AdminPage.jsx
//  Admin/Owner commission dashboard — live user list
// ══════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { Shield, DollarSign, TrendingUp, Users, Package, Activity, RefreshCw, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import API from '../api/client';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [users, setUsers]     = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');

  const fetchData = useCallback(async () => {
    if (!isAdmin) { navigate('/feed'); return; }
    setLoading(true);
    try {
      const [summaryRes, usersRes, reportsRes] = await Promise.all([
        API.get('/market/admin-summary'),
        API.get('/admin/users'),
        API.get('/reports')
      ]);
      setData(summaryRes.data);
      setUsers(usersRes.data);
      setReports(reportsRes.data || []);
    } catch (err) {
      push(err.response?.data?.error || 'Failed to load admin data', 'error');
    } finally { setLoading(false); }
  }, [isAdmin, navigate, push]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 pt-14 pb-20 md:pb-4">
      {/* Header */}
      <div className="border-b border-amber-500/20 px-4 py-3 bg-amber-500/3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <div>
              <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Admin Dashboard</h1>
              <p className="text-[9px] sm:text-[10px] text-amber-400/60">Live platform overview · auto-refreshes every 30s</p>
            </div>
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-1 py-2">
          {[['overview','OVERVIEW'], ['users','USERS'], ['transactions','TRANSACTIONS'], ['reports','MODERATION']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg transition-all
                ${tab === v ? 'bg-amber-500/15 text-amber-400' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {loading && !data ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* ── OVERVIEW ──────────────────────────────── */}
            {tab === 'overview' && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { icon: DollarSign, label: 'Commission Earned', value: `$${data.total_commission?.toFixed(2) || '0.00'}`, sub: '10% of all sales', color: 'amber' },
                    { icon: TrendingUp, label: 'Total GMV',         value: `$${data.total_volume?.toFixed(2) || '0.00'}`,     sub: 'gross marketplace volume', color: 'emerald' },
                    { icon: Activity,   label: 'Transactions',      value: data.total_transactions || 0,                       sub: 'completed purchases', color: 'sky' },
                    { icon: Users,      label: 'Users',             value: data.userCount || 0,                                sub: 'registered accounts', color: 'violet' },
                  ].map(({ icon: Icon, label, value, sub, color }) => (
                    <div key={label} className={`bg-slate-900 border border-${color}-500/15 rounded-2xl p-3 sm:p-4`}>
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${color}-400`} />
                        <p className={`text-[8px] sm:text-[9px] font-black text-${color}-400 uppercase tracking-widest leading-tight`}>{label}</p>
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-white">{value}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue breakdown */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-black text-white uppercase tracking-widest">Revenue Split</h2>
                  </div>
                  <div className="space-y-2">
                    <SRow label="Total Sales Volume"       value={`$${data.total_volume?.toFixed(2)}`}      color="text-white" />
                    <SRow label="→ Platform Commission (10%)" value={`$${data.total_commission?.toFixed(2)}`} color="text-amber-400" />
                    <SRow label="→ Seller Payouts (90%)"   value={`$${data.total_payouts?.toFixed(2)}`}     color="text-emerald-400" />
                  </div>
                  <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex justify-between items-center">
                    <p className="text-[10px] text-amber-400/80 font-bold">Commission Rate</p>
                    <p className="text-sm font-black text-amber-400">10.00%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-slate-900 border border-white/5 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
                    <Package className="w-5 h-5 text-sky-400 flex-shrink-0" />
                    <div>
                      <p className="text-lg sm:text-xl font-black text-white">{data.listingCount || 0}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-600">Total Listings</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-white/5 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-lg sm:text-xl font-black text-white">{users.length}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-600">Registered Users</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── USERS ─────────────────────────────────── */}
            {tab === 'users' && (
              <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-400" />
                    <h2 className="text-xs font-black text-white uppercase tracking-widest">All Users ({users.length})</h2>
                  </div>
                  <p className="text-[9px] text-slate-600">Live · refreshes every 30s</p>
                </div>
                {users.length === 0 ? (
                  <p className="text-center py-8 text-slate-600 text-xs font-bold">NO USERS YET</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {users.map(u => (
                      <div key={u.id} className={`flex items-center gap-3 p-3 sm:p-4 transition-all ${u.status === 'banned' ? 'bg-red-500/5' : 'hover:bg-white/3'}`}>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sm font-black text-sky-400 flex-shrink-0">
                          {(u.name || 'F')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black text-white truncate">{u.name}</p>
                            {u.role === 'admin' || u.role === 'ROOT_ADMIN' ? <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">ADMIN</span> : null}
                            {u.status === 'banned' && <span className="text-[8px] font-black text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">BANNED</span>}
                            {u.status === 'market_banned' && <span className="text-[8px] font-black text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">MARKET BANNED</span>}
                            {u.warnings_count > 0 && <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{u.warnings_count} WARNS</span>}
                          </div>
                          <p className="text-[9px] text-slate-600 truncate">{u.email}</p>
                        </div>
                        <div className="flex gap-2 items-center text-right flex-shrink-0">
                          {u.role !== 'ROOT_ADMIN' && u.id !== user?.id && (
                            <>
                              <button onClick={async () => {
                                await API.post(`/reports/users/${u.id}/action`, { action: u.status === 'banned' ? 'unban' : 'ban' });
                                push(u.status === 'banned' ? 'User unbanned' : 'User banned', 'success');
                                fetchData();
                              }} className="text-[9px] font-black px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
                                {u.status === 'banned' ? 'UNBAN' : 'BAN'}
                              </button>
                              <button onClick={async () => {
                                await API.post(`/reports/users/${u.id}/action`, { action: 'warn' });
                                push('User warned', 'success');
                                fetchData();
                              }} className="text-[9px] hidden sm:block font-black px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
                                WARN
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── REPORTS/MODERATION ──────────────────── */}
            {tab === 'reports' && (
              <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <h2 className="text-xs font-black text-white uppercase tracking-widest">Dispute & Abuse Reports</h2>
                  </div>
                </div>
                {reports.length === 0 ? (
                  <p className="text-center py-8 text-slate-600 text-xs font-bold">NO REPORTS YET</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {reports.map(r => (
                      <div key={r.id} className="p-4 hover:bg-white/3 transition-all space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-black text-white"><span className="text-slate-500">Target:</span> {r.reported_name}</p>
                            <p className="text-[10px] text-slate-500">Reporter: {r.reporter_name} · {new Date(r.created_at).toLocaleString()}</p>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-1 rounded tracking-widest ${r.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-500'}`}>
                            {r.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 bg-black/40 p-3 rounded-xl border border-white/5 whitespace-pre-wrap">"{r.details}"</p>
                        <p className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-1 rounded w-max font-black tracking-widest">AUTO_LOG: {r.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TRANSACTIONS ──────────────────────────── */}
            {tab === 'transactions' && (
              <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <h2 className="text-xs font-black text-white uppercase tracking-widest">Recent Transactions</h2>
                </div>
                {(!data.recentTransactions || data.recentTransactions.length === 0) ? (
                  <p className="text-center py-8 text-slate-600 text-xs font-bold">NO TRANSACTIONS YET</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-mono min-w-[500px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          {['Listing', 'Buyer', 'Seller', 'Amount', 'Commission', 'Date'].map(h => (
                            <th key={h} className="text-left p-3 text-slate-600 uppercase tracking-widest font-black">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentTransactions.map(tx => (
                          <tr key={tx.id} className="border-b border-white/3 hover:bg-white/3 transition-all">
                            <td className="p-3 text-slate-300 max-w-[140px] truncate">{tx.title}</td>
                            <td className="p-3 text-slate-400">{tx.buyer_name}</td>
                            <td className="p-3 text-slate-400">{tx.seller_name}</td>
                            <td className="p-3 text-white font-black">${tx.amount?.toFixed(2)}</td>
                            <td className="p-3 text-amber-400 font-black">${tx.commission?.toFixed(2)}</td>
                            <td className="p-3 text-slate-600">{new Date(tx.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-16 text-slate-600 text-xs font-bold">FAILED TO LOAD DATA</p>
        )}
      </div>
    </div>
  );
}

function SRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`font-black text-sm ${color}`}>{value}</span>
    </div>
  );
}
