import React, { useState } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  Scale, 
  FileText, 
  HelpCircle
} from 'lucide-react';
import { CIVIC_GLOSSARY, GlossaryTerm } from '../data/civicGlossary';
import { Language } from '../types';

interface CivicGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const CivicGlossaryModal: React.FC<CivicGlossaryModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const [search, setSearch] = useState('');
  const [selectedContext, setSelectedContext] = useState('All');

  if (!isOpen) return null;

  const contexts = ['All', 'RTI', 'Consumer', 'Welfare', 'Caste', 'Tenancy', 'Document', 'Legal'];

  const filtered = CIVIC_GLOSSARY.filter(item => {
    if (selectedContext !== 'All' && !item.context.toLowerCase().includes(selectedContext.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.officialTermEn.toLowerCase().includes(q) || 
             item.officialTermHi.toLowerCase().includes(q) || 
             item.simpleMeaningEn.toLowerCase().includes(q) ||
             item.simpleMeaningHi.toLowerCase().includes(q) ||
             (item.officialReference && item.officialReference.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl text-blue-700">
              📖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif text-slate-900">
                  {language === 'hi' ? 'नागरिक एवं कानूनी शब्दावली' : 'Civic & Legal Glossary'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                  Demystified
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Understand administrative and statutory jargon in plain, everyday language.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {contexts.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedContext(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedContext === cat
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search legal term (e.g. PIO, Sanction)..."
              className="bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>
        </div>

        {/* Glossary Terms */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                      {language === 'hi' ? item.officialTermHi : item.officialTermEn}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
                      {item.context}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed mb-3">
                    {language === 'hi' ? item.simpleMeaningHi : item.simpleMeaningEn}
                  </p>
                </div>

                {item.officialReference && (
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900">
                    <strong className="text-blue-950 font-semibold">Statutory Grounding: </strong>
                    {item.officialReference}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
