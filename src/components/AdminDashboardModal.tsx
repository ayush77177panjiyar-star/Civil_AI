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
  AlertTriangle,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Search,
  ChevronRight,
  UserCheck,
  FileCode,
  List
} from 'lucide-react';
import { Language } from '../types';
import { fetchAllRegisteredUsersFromSupabase, fetchAllUserActivitiesFromSupabase, UserActivityRecord } from '../lib/supabase';

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
  const [authenticated, setAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'users' | 'activities'>('users');
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<UserActivityRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Selected item modal for detailed form view
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<UserActivityRecord | null>(null);

  const ADMIN_EMAIL = 'ayush77177panjiyar@gmail.com';
  const ADMIN_PASSWORD = 'Ayush@13579';

  useEffect(() => {
    if (!isOpen) return;
    const saved = sessionStorage.getItem('civicai_admin_authenticated');
    if (saved === 'true') {
      setAuthenticated(true);
      loadRealData();
    } else {
      setAuthenticated(false);
    }
  }, [isOpen]);

  const loadRealData = async () => {
    setIsLoadingData(true);
    try {
      const users = await fetchAllRegisteredUsersFromSupabase();
      const activities = await fetchAllUserActivitiesFromSupabase();
      setRegisteredUsers(users);
      setActivityLogs(activities);
    } catch (e) {
      console.warn('Failed to load admin data:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && cleanPassword === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('civicai_admin_authenticated', 'true');
      loadRealData();
    } else {
      setAuthError('You entered wrong email and password');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('civicai_admin_authenticated');
    setAuthenticated(false);
    setEmailInput('');
    setPasswordInput('');
    setAuthError('');
  };

  const toggleShowPassword = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  if (!isOpen) return null;

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
          
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base font-serif">Admin Authentication Portal</h3>
                <p className="text-xs text-slate-400">Footer-restricted administrative console</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
            {authError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs font-bold text-red-800 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md uppercase tracking-wider transition-all"
            >
              Sign In to Admin Dashboard
            </button>
          </form>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-500">
              Restricted to authorized system administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = registeredUsers.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.user_id || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.full_name || '').toLowerCase().includes(term)
    );
  });

  const filteredActivities = activityLogs.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.user_id || '').toLowerCase().includes(term) ||
      (a.activity_type || '').toLowerCase().includes(term) ||
      JSON.stringify(a.payload || {}).toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900 max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif">Centralized Admin Monitoring Dashboard</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase">
                  Authenticated: {ADMIN_EMAIL}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                100% Real User Credentials, Activity Logs & Form Submissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadRealData}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Refresh Real Data</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-950 border border-red-800 hover:bg-red-900 text-red-200 font-semibold transition-colors"
            >
              Sign Out
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab & Search Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Registered Citizen Users ({registeredUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'activities'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>User Activity Logs & Forms ({activityLogs.length})</span>
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search User ID, Name, Email..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          
          {isLoadingData ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Loading real user credentials & activity data from Supabase...
            </div>
          ) : activeTab === 'users' ? (
            <div>
              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                  No registered citizen accounts found yet. Users will appear here instantly when they register.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider font-bold text-[11px]">
                        <tr>
                          <th className="p-3.5">Citizen User ID</th>
                          <th className="p-3.5">Account Password</th>
                          <th className="p-3.5">Full Name</th>
                          <th className="p-3.5">Email Address</th>
                          <th className="p-3.5">Registration Date</th>
                          <th className="p-3.5 text-right">Form Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => (
                          <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 font-bold font-mono text-blue-700">
                              {user.user_id}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-800 font-semibold bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                  {showPasswords[user.user_id] ? user.password_hash || '••••••••' : '••••••••'}
                                </span>
                                <button
                                  onClick={() => toggleShowPassword(user.user_id)}
                                  className="text-slate-400 hover:text-slate-700 p-1"
                                  title="Toggle Password Visibility"
                                >
                                  {showPasswords[user.user_id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-900">
                              {user.full_name || user.profile_data?.name || 'Citizen'}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {user.email || user.profile_data?.email || 'N/A'}
                            </td>
                            <td className="p-3.5 text-slate-500 text-[11px]">
                              {user.created_at ? new Date(user.created_at).toLocaleString() : 'Recent'}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => setSelectedUserDetail(user)}
                                className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ml-auto"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View User Form Details</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {filteredActivities.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                  No user activity logs or form submissions recorded yet. Real user queries will appear here.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider font-bold text-[11px]">
                        <tr>
                          <th className="p-3.5">Timestamp</th>
                          <th className="p-3.5">User ID</th>
                          <th className="p-3.5">Module / Feature</th>
                          <th className="p-3.5">User Input Summary</th>
                          <th className="p-3.5 text-right">Form Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredActivities.map((act) => (
                          <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                              {act.created_at ? new Date(act.created_at).toLocaleTimeString() : 'Just now'}
                            </td>
                            <td className="p-3.5 font-bold font-mono text-blue-700">
                              {act.user_id}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                                {act.activity_type}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-800 font-medium max-w-xs truncate">
                              {act.payload?.userProblem || act.payload?.query || act.payload?.title || 'User Activity'}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => setSelectedActivityDetail(act)}
                                className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ml-auto"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Inspect Full Form Payload</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Selected User Form Details Modal */}
        {selectedUserDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto text-slate-900">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold font-serif">
                    Citizen Profile Details: <span className="font-mono text-blue-700">{selectedUserDetail.user_id}</span>
                  </h3>
                </div>
                <button onClick={() => setSelectedUserDetail(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Credentials</span>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div>User ID: <strong className="text-blue-700">{selectedUserDetail.user_id}</strong></div>
                    <div>Password: <strong className="text-red-700">{selectedUserDetail.password_hash}</strong></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Contact Information</span>
                  <div className="space-y-1">
                    <div>Full Name: <strong>{selectedUserDetail.full_name || selectedUserDetail.profile_data?.name || 'N/A'}</strong></div>
                    <div>Email: <strong>{selectedUserDetail.email || selectedUserDetail.profile_data?.email || 'N/A'}</strong></div>
                    <div>Phone: <strong>{selectedUserDetail.profile_data?.phone || 'N/A'}</strong></div>
                  </div>
                </div>

                {selectedUserDetail.profile_data && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Address & Saved Profile Payload</span>
                    <pre className="p-2 bg-slate-900 text-slate-200 rounded-lg text-[11px] overflow-x-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedUserDetail.profile_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 text-right">
                <button onClick={() => setSelectedUserDetail(null)} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Activity Form Details Modal */}
        {selectedActivityDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto text-slate-900">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold font-serif">
                    Form Submission Details ({selectedActivityDetail.activity_type})
                  </h3>
                </div>
                <button onClick={() => setSelectedActivityDetail(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>User Account: <strong className="font-mono text-blue-700">{selectedActivityDetail.user_id}</strong></span>
                  <span>Date: <strong className="text-slate-600">{new Date(selectedActivityDetail.created_at || '').toLocaleString()}</strong></span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Full Form Payload & User Input</span>
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-[11px] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {JSON.stringify(selectedActivityDetail.payload, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 text-right">
                <button onClick={() => setSelectedActivityDetail(null)} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">
                  Close Form Details
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
