import React, { useState, useEffect } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  HeroSection 
} from './components/HeroSection';
import { 
  FeatureGrid 
} from './components/FeatureGrid';
import { 
  RtiDraftingAgent 
} from './components/RtiDraftingAgent';
import { 
  RightsNavigator 
} from './components/RightsNavigator';
import { 
  SchemeEligibilityReader 
} from './components/SchemeEligibilityReader';
import { 
  ConversationalFormFiller 
} from './components/ConversationalFormFiller';
import { 
  DocumentInterpreter 
} from './components/DocumentInterpreter';
import { MyInformation } from './components/MyInformation';
import { 
  OfficialPortalsModal 
} from './components/OfficialPortalsModal';
import { 
  CivicGlossaryModal 
} from './components/CivicGlossaryModal';
import { 
  AdminDashboardModal 
} from './components/AdminDashboardModal';
import { 
  HistoryDrawer 
} from './components/HistoryDrawer';
import { Language } from './types';
import { getSavedLanguage, saveLanguage, t, SUPPORTED_LANGUAGES } from './lib/i18n';
import { 
  FileText, 
  Scale, 
  Award, 
  FormInput, 
  BookOpenCheck, 
  Compass, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Languages
} from 'lucide-react';

import { UserProvider } from './context/UserContext';
import { DataModeBanner } from './components/DataModeBanner';
import { InitialChoiceModal } from './components/InitialChoiceModal';

function AppContent() {
  const [language, setLanguage] = useState<Language>(() => getSavedLanguage());
  const [activeTab, setActiveTab] = useState<string>('home');
  const [initialDataForTool, setInitialDataForTool] = useState<any>(null);

  // Modals state
  const [isPortalsOpen, setIsPortalsOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleSelectLanguage = (newLang: Language) => {
    setLanguage(newLang);
    saveLanguage(newLang);
  };

  const handleSelectTab = (tab: string, initialData?: any) => {
    setActiveTab(tab);
    if (initialData) {
      setInitialDataForTool(initialData);
    } else {
      setInitialDataForTool(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Sleek Navbar */}
      <Navbar
        language={language}
        onSelectLanguage={handleSelectLanguage}
        onOpenPortals={() => setIsPortalsOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Global Data Mode Isolation Banner */}
      <DataModeBanner language={language} />

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sleek Left Sidebar (Desktop) */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 p-5 flex-col justify-between shrink-0 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                {t('home', language)} • CivicAI Tools
              </h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                <Languages className="w-2.5 h-2.5" />
                {activeLangObj.nativeName}
              </span>
            </div>

            <ul className="space-y-1.5">
              <li>
                <button
                  id="sidebar-btn-home"
                  onClick={() => handleSelectTab('home')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all ${
                    activeTab === 'home'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-base">🌐</span>
                  <span className="text-xs">
                    {t('home', language)}
                  </span>
                </button>
              </li>

              <li>
                <button
                  id="sidebar-btn-rti"
                  onClick={() => handleSelectTab('rti')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all ${
                    activeTab === 'rti'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-base">📝</span>
                  <div className="flex-1">
                    <span className="text-xs block">
                      {t('rtiTool', language)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Section 6(1) RTI Act 2005</span>
                  </div>
                </button>
              </li>

              <li>
                <button
                  id="sidebar-btn-rights"
                  onClick={() => handleSelectTab('rights')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all ${
                    activeTab === 'rights'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-base">⚖️</span>
                  <div className="flex-1">
                    <span className="text-xs block">
                      {t('rightsTool', language)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Evidence & Escalation</span>
                  </div>
                </button>
              </li>

              <li>
                <button
                  id="sidebar-btn-schemes"
                  onClick={() => handleSelectTab('schemes')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all ${
                    activeTab === 'schemes'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-base">🏛️</span>
                  <div className="flex-1">
                    <span className="text-xs block">
                      {t('schemeTool', language)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Verified Welfare Schemes</span>
                  </div>
                </button>
              </li>

              <li>
                <button
                  id="sidebar-btn-forms"
                  onClick={() => handleSelectTab('forms')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all ${
                    activeTab === 'forms'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-base">📄</span>
                  <div className="flex-1">
                    <span className="text-xs block">
                      {t('formTool', language)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Conversational Assistant</span>
                  </div>
                </button>
              </li>

              <li>
                <button
                  id="sidebar-btn-document"
                  onClick={() => handleSelectTab('document')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all ${
                    activeTab === 'document'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-base">📚</span>
                  <div className="flex-1">
                    <span className="text-xs block">
                      {t('documentTool', language)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Gazette & Notice OCR</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  id="sidebar-btn-profile"
                  onClick={() => handleSelectTab('profile')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-base">👤</span>
                  <span className="text-xs">My Information</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Immediate Help Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>{activeLangObj.nativeName} AI Activated</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
              {t('languageActiveNote', language)}
            </p>
            <button
              onClick={() => handleSelectTab('home')}
              className="w-full py-2 bg-blue-700 hover:bg-blue-600 rounded-xl text-xs font-bold transition-all uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>{t('analyzeProblem', language)}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
          
          {/* Breadcrumb Navigation Bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <button 
                onClick={() => handleSelectTab('home')}
                className="hover:text-blue-700 font-semibold"
              >
                CivicAI
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                {activeTab === 'home' && t('home', language)}
                {activeTab === 'rti' && t('rtiTool', language)}
                {activeTab === 'rights' && t('rightsTool', language)}
                {activeTab === 'schemes' && t('schemeTool', language)}
                {activeTab === 'forms' && t('formTool', language)}
                {activeTab === 'document' && t('documentTool', language)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                {t('noSourceNoClaim', language)}
              </span>
            </div>
          </div>

          {/* Tab Views */}
          {activeTab === 'home' && (
            <div>
              <HeroSection
                language={language}
                onSelectTab={handleSelectTab}
              />
              <FeatureGrid
                language={language}
                onSelectTab={handleSelectTab}
              />
            </div>
          )}

          {activeTab === 'rti' && (
            <RtiDraftingAgent
              language={language}
              initialQuery={initialDataForTool?.query}
            />
          )}

          {activeTab === 'rights' && (
            <RightsNavigator
              language={language}
              initialQuery={initialDataForTool?.query}
            />
          )}

          {activeTab === 'schemes' && (
            <SchemeEligibilityReader
              language={language}
              initialQuery={initialDataForTool?.query}
            />
          )}

          {activeTab === 'forms' && (
            <ConversationalFormFiller
              language={language}
              initialQuery={initialDataForTool?.query}
            />
          )}

          {activeTab === 'profile' && (
            <MyInformation language={language} />
          )}

          {activeTab === 'document' && (
            <DocumentInterpreter
              language={language}
              initialQuery={initialDataForTool?.query}
            />
          )}

        </main>
      </div>

      {/* Sleek Micro-Footer */}
      <footer className="h-9 bg-slate-900 flex items-center px-4 sm:px-8 text-[11px] text-slate-400 justify-between border-t border-slate-800 shrink-0">
        <p className="truncate max-w-md sm:max-w-xl">
          {t('systemNotice', language)}
        </p>
        <div className="flex items-center gap-4 uppercase tracking-widest text-[10px]">
          <span className="text-slate-300 font-semibold">© 2026 CivicAI Platform</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPortalsOpen(true)}
              className="text-blue-400 hover:underline hidden sm:inline"
            >
              Portals
            </button>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-slate-400 hover:text-white hover:underline"
              title={t('auditDashboard', language)}
            >
              Admin Login
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <OfficialPortalsModal
        isOpen={isPortalsOpen}
        onClose={() => setIsPortalsOpen(false)}
        language={language}
      />

      <CivicGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        language={language}
      />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        language={language}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        language={language}
        onSelectTab={handleSelectTab}
      />

      {/* Mode selection modal for first-time visitors */}
      <InitialChoiceModal language={language} />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
