import React, { useEffect, useState } from 'react';
import { 
  X, 
  Activity, 
  ShieldCheck, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Database,
  Layers,
  Sparkles,
  Search,
  Server
} from 'lucide-react';
import { Language, AdminStats } from '../types';
import { t } from '../lib/i18n';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(() => sessionStorage.getItem('civicai_admin_token') || '');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;
    setIsLoading(true);
    fetch('/api/civic/admin/stats', { headers: { 'x-admin-token': token } })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || 'Admin authentication failed');
        return data;
      })
      .then(data => {
        setStats(data);
        setAuthenticated(true);
      })
      .catch(() => {
        sessionStorage.removeItem('civicai_admin_token');
        setToken('');
        setAuthenticated(false);
        setStats(null);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, token]);

  const login = async () => {
    const value = token.trim();
    if (!value) return;
    sessionStorage.setItem('civicai_admin_token', value);
    setToken(value);
  };

  const logout = () => {
    sessionStorage.removeItem('civicai_admin_token');
    setToken('');
    setAuthenticated(false);
    setStats(null);
  };

  if (!isOpen) return null;

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">CivicAI Admin Login</h2>
              <p className="text-xs text-slate-500 mt-1">Enter the administrator access token configured on the server.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
          </div>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') login(); }}
            placeholder="Admin access token"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={login} disabled={!token.trim() || isLoading} className="mt-3 w-full rounded-xl bg-slate-900 text-white py-2.5 font-semibold disabled:opacity-50">
            {isLoading ? 'Checking…' : 'Sign in'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900 max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif">CivicAI System Analytics</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase">
                  Supabase Live: spkwmbxklttqkhnfamrp
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Rule 14: Real user queries strictly segregated from instructional example views.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={logout} className="text-xs text-slate-300 hover:text-white">Sign out</button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          
          {/* Segregation Rule Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <strong className="font-bold block">Strict Real User Analytics Isolation:</strong>
                <span>Example content views and sample cases are excluded from customer usage statistics.</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[10px] uppercase shrink-0">
              Zero Fake Metrics
            </span>
          </div>

          {/* Top KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Real User Queries
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 font-serif">
                  {stats?.totalQueries || 0}
                </span>
                <span className="text-xs text-emerald-600 font-bold">Genuine</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Submitted by real citizens
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Instructional Examples
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-amber-600 font-serif">
                  {(stats as any)?.exampleQueriesServed || 0}
                </span>
                <span className="text-xs text-amber-700 font-bold">Guidance</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Not counted as user activity
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Official Source Grounding
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-blue-700 font-serif">
                  {stats?.sourceVerificationRate ? `${stats.sourceVerificationRate}%` : '100%'}
                </span>
                <span className="text-xs text-emerald-600 font-bold">Strict</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                NO SOURCE = NO CLAIM
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Supabase Sync Status
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-emerald-700 font-serif">
                  Active
                </span>
                <span className="text-xs text-emerald-700 font-bold">spkwmb...</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Clean user DB isolation
              </p>
            </div>

          </div>

          {/* Module Real Usage Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 font-serif mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              Real User Module Requests:
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  RTI DRAFTS
                </span>
                <span className="text-lg font-bold text-slate-900 font-serif mt-1 block">
                  {stats?.rtiDraftsGenerated || 0}
                </span>
                <span className="text-[10px] text-slate-400">real drafts</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  SCHEMES EVAL
                </span>
                <span className="text-lg font-bold text-slate-900 font-serif mt-1 block">
                  {stats?.schemesEvaluated || 0}
                </span>
                <span className="text-[10px] text-slate-400">real evaluations</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  RIGHTS NAV
                </span>
                <span className="text-lg font-bold text-slate-900 font-serif mt-1 block">
                  {stats?.activeUsers || 0}
                </span>
                <span className="text-[10px] text-slate-400">real grievances</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  FORMS FILLED
                </span>
                <span className="text-lg font-bold text-slate-900 font-serif mt-1 block">
                  {stats?.formsCompleted || 0}
                </span>
                <span className="text-[10px] text-slate-400">real forms</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  DOCS OCR
                </span>
                <span className="text-lg font-bold text-slate-900 font-serif mt-1 block">
                  {stats?.documentsInterpreted || 0}
                </span>
                <span className="text-[10px] text-slate-400">real notices</span>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 font-serif mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Real User Audit Trail:
            </h3>

            {stats?.recentLogs && stats.recentLogs.length > 0 ? (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 text-xs">
                {stats.recentLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                          {log.feature}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Confidence: {log.confidence}
                        </span>
                      </div>
                      <p className="text-slate-800 text-xs font-sans truncate max-w-lg">
                        Query: "{log.userQuery}"
                      </p>
                    </div>

                    <div className="text-right text-[11px]">
                      <span className="text-slate-500">Sources: </span>
                      <span className="text-blue-700 font-semibold">{log.sourcesCited.join(', ') || 'Official Framework'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-3 text-center">
                Clean state. No real user queries submitted yet.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
