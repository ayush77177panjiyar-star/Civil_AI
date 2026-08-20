import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, 
  BookOpen, 
  ShieldCheck, 
  History, 
  ExternalLink,
  Languages,
  Check,
  ChevronDown
} from 'lucide-react';
import { Language } from '../types';
import { SUPPORTED_LANGUAGES, t } from '../lib/i18n';

interface NavbarProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onOpenPortals: () => void;
  onOpenGlossary: () => void;
  onOpenHistory: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onSelectLanguage,
  onOpenPortals,
  onOpenGlossary,
  onOpenHistory,
  activeTab,
  onSelectTab
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs text-slate-900">
      {/* Top micro-bar with official trust notice */}
      <div className="bg-slate-900 px-4 sm:px-8 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Multilingual Indian Civic AI
            </span>
            <span className="hidden sm:inline text-slate-300 text-[11px]">
              {t('appTagline', language)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Rule: "NO SOURCE = NO CLAIM"
            </span>
            <button 
              onClick={onOpenPortals}
              className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-blue-400" />
              <span>{t('portalsDirectory', language)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sleek Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => onSelectTab('home')}
          >
            <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 transition-colors">
              <span className="text-white font-bold text-lg font-serif">C</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">
                  CivicAI
                </span>
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded uppercase border border-blue-200">
                  {currentLangObj.nativeName}
                </span>
              </div>
              <span className="text-[10px] text-slate-600 font-medium hidden sm:inline">
                AI for Civic & Legal Empowerment
              </span>
            </div>
          </div>

          {/* Center Navigation tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'home' 
                  ? 'bg-white text-blue-800 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('home', language)}
            </button>
            <button
              onClick={() => onSelectTab('rti')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'rti' 
                  ? 'bg-white text-blue-800 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📝</span>
              <span>{t('rtiTool', language)}</span>
            </button>
            <button
              onClick={() => onSelectTab('rights')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'rights' 
                  ? 'bg-white text-blue-800 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚖️</span>
              <span>{t('rightsTool', language)}</span>
            </button>
            <button
              onClick={() => onSelectTab('schemes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'schemes' 
                  ? 'bg-white text-blue-800 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏛️</span>
              <span>{t('schemeTool', language)}</span>
            </button>
            <button
              onClick={() => onSelectTab('forms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'forms' 
                  ? 'bg-white text-blue-800 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📄</span>
              <span>{t('formTool', language)}</span>
            </button>
            <button
              onClick={() => onSelectTab('document')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'document' 
                  ? 'bg-white text-blue-800 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📚</span>
              <span>{t('documentTool', language)}</span>
            </button>
          </nav>

          {/* Right action tools & Language Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Prominent Indian Language Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="btn-language-selector"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-300 shadow-2xs transition-all"
                title={t('selectLanguage', language)}
              >
                <Languages className="w-4 h-4 text-blue-600" />
                <span className="font-bold">{currentLangObj.nativeName}</span>
                <span className="text-slate-600 hidden sm:inline">({currentLangObj.name})</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 14 Languages Dropdown Menu */}
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-blue-600" />
                        {t('selectLanguage', language)}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        14 Languages
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      {t('languageActiveNote', language)}
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto grid grid-cols-2 gap-1 p-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        id={`btn-lang-${lang.code}`}
                        onClick={() => {
                          onSelectLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                          language === lang.code
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-tight">
                            {lang.nativeName}
                          </span>
                          <span className={`text-[10px] ${language === lang.code ? 'text-blue-100' : 'text-slate-600'}`}>
                            {lang.name}
                          </span>
                        </div>
                        {language === lang.code && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Glossary */}
            <button
              onClick={onOpenGlossary}
              className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
              title={t('civicGlossary', language)}
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* History */}
            <button
              onClick={onOpenHistory}
              className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
              title={t('history', language)}
            >
              <History className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
