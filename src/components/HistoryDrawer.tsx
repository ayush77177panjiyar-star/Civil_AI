import React from 'react';
import { 
  X, 
  History, 
  Clock,
  Trash2
} from 'lucide-react';
import { Language } from '../types';
import { useUserData } from '../context/UserContext';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectTab: (tab: string, initialData?: any) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  language,
  onSelectTab
}) => {
  const { activities, clearActivities, userId } = useUserData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between">
        
        {/* Header */}
        <div>
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm font-serif">
                  {language === 'hi' ? 'हाल की गतिविधियाँ एवं ड्राफ्ट' : 'Recent Activities & Saved Drafts'}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                  User ID: {userId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activities.length > 0 && (
                <button
                  onClick={clearActivities}
                  title="Clear history"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-160px)]">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">
                  {language === 'hi' ? 'कोई हाल की गतिविधि नहीं' : 'No recent activity records found'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'hi' ? 'आपके द्वारा बनाए गए ड्राफ्ट यहाँ दिखाई देंगे' : 'Activities & generated drafts for your account will appear here securely.'}
                </p>
              </div>
            ) : (
              activities.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.tab, item.payload);
                    onClose();
                  }}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{item.icon}</span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                        {item.type}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
                        <Clock className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className="text-[11px] text-slate-500">
            Privacy First: Multi-tenant RLS guarantees your activity is private to your user session.
          </p>
        </div>

      </div>
    </div>
  );
};
