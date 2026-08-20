import React, { useState } from 'react';
import { useUserData } from '../context/UserContext';
import { User, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { t } from '../lib/i18n';

interface DataModeBannerProps {
  language: Language;
}

export const DataModeBanner: React.FC<DataModeBannerProps> = ({ language }) => {
  const { userId, clearUserData } = useUserData();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearUserData = async () => {
    await clearUserData();
    setShowClearConfirm(false);
    triggerNotification('All personal drafts and data cleared.');
  };

  return (
    <>
      <div className="bg-emerald-900 text-white px-4 py-1.5 border-b border-emerald-800 text-xs shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Mode Indicator */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase tracking-wider bg-emerald-700 text-white shadow-xs">
              <User className="w-3 h-3" />
              Clean User State Active
            </span>

            <p className="text-[11px] hidden sm:inline font-medium">
              <span className="text-emerald-100">
                User Account: <code className="text-[10px] font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700 text-emerald-300">{userId.slice(0, 14)}...</code> • Clean initial experience. Click <strong>Show Example</strong> in any tool for temporary guidance.
              </span>
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <button
              id="btn-clear-user-data"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-red-200 bg-red-950/60 border border-red-800 hover:bg-red-900 transition-colors"
              title="Permanently erase my personal information and drafts"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
              <span>Clear My Data</span>
            </button>
          </div>

        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">{notification}</p>
        </div>
      )}

      {/* Confirmation Modal: Clear User Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Clear My Information?</h3>
                <p className="text-xs text-slate-500">Delete personal inputs & saved drafts</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete all personal drafts, profiles, and form inputs for account <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">{userId.slice(0, 14)}...</code>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleClearUserData}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs"
              >
                Yes, Clear My Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
