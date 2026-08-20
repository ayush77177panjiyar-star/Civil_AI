import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Search, 
  ShieldCheck, 
  Building2, 
  FileCheck, 
  Scale, 
  HelpCircle,
  Award
} from 'lucide-react';
import { OFFICIAL_PORTALS } from '../data/officialSources';
import { Language, OfficialSourceRef } from '../types';

interface OfficialPortalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const OfficialPortalsModal: React.FC<OfficialPortalsModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const [search, setSearch] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<'All' | 'Central' | 'State'>('All');

  if (!isOpen) return null;

  const filtered = OFFICIAL_PORTALS.filter(p => {
    if (jurisdictionFilter === 'Central' && !p.isCentral) return false;
    if (jurisdictionFilter === 'State' && p.isCentral) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || 
             p.departmentOrMinistry.toLowerCase().includes(q) || 
             p.description.toLowerCase().includes(q) ||
             (p.stateOrUt && p.stateOrUt.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl text-blue-700">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif text-slate-900">
                  {language === 'hi' ? 'आधिकारिक सरकारी पोर्टल डायरेक्टरी' : 'Official Government Portals Directory'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  100% Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500">
                CivicAI directly links citizens to legitimate, secure government domains (.gov.in & .nic.in).
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

        {/* Search & Jurisdiction Filter */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setJurisdictionFilter('All')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                jurisdictionFilter === 'All'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All Jurisdictions
            </button>
            <button
              onClick={() => setJurisdictionFilter('Central')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                jurisdictionFilter === 'Central'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Central Government (.gov.in)
            </button>
            <button
              onClick={() => setJurisdictionFilter('State')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                jurisdictionFilter === 'State'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              State & Local Portals
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search portal or ministry..."
              className="bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>
        </div>

        {/* Portal Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((portal, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      portal.isCentral 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {portal.isCentral ? 'Central Authority' : `${portal.stateOrUt || 'State'} Government`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 font-serif mb-1">
                    {portal.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-2 font-medium">
                    {portal.departmentOrMinistry}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {portal.description}
                  </p>
                  {portal.notes && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mb-3 italic">
                      {portal.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
                    {portal.portalUrl}
                  </span>
                  <a
                    href={portal.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline"
                  >
                    <span>Visit Official Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
