import React from 'react';
import { 
  X, 
  History, 
  FileText, 
  Scale, 
  Award, 
  BookOpenCheck, 
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Language } from '../types';

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
  if (!isOpen) return null;

  const sampleHistory = [
    {
      id: 'h-1',
      type: 'RTI Draft',
      title: 'Village Road Sanction & Expenditure Inquiry (Bihar)',
      date: 'Today, 10:15 AM',
      tab: 'rti',
      icon: '📝'
    },
    {
      id: 'h-2',
      type: 'Scheme Evaluation',
      title: 'Student 20yo - Post-Matric & Higher Ed Scholarships',
      date: 'Yesterday, 4:30 PM',
      tab: 'schemes',
      icon: '🏛️'
    },
    {
      id: 'h-3',
      type: 'Rights Analysis',
      title: 'Consumer Grievance for Non-Delivery of ₹18,500 Appliance',
      date: '18 Jan 2026',
      tab: 'rights',
      icon: '⚖️'
    }
  ];

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
                <p className="text-[11px] text-slate-400">
                  Local session storage
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-160px)]">
            {sampleHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectTab(item.tab);
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
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className="text-[11px] text-slate-500">
            Privacy First: No personal data is stored on remote servers without citizen consent.
          </p>
        </div>

      </div>
    </div>
  );
};
