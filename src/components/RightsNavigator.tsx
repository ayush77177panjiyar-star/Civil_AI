import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  FileCheck, 
  TrendingUp, 
  Layers,
  HelpCircle,
  Clock,
  PhoneCall,
  Check,
  User,
  BookOpen
} from 'lucide-react';
import { Language, RightsAnalysisResult, EvidenceItem } from '../types';
import { CivicApiService } from '../services/aiService';
import { t } from '../lib/i18n';
import { useUserData } from '../context/UserContext';
import { ExampleModal } from './ExampleModal';

interface RightsNavigatorProps {
  language: Language;
  initialQuery?: string;
}

export const RightsNavigator: React.FC<RightsNavigatorProps> = ({
  language,
  initialQuery = ''
}) => {
  const { userData, updateUserData } = useUserData();

  const [problemQuery, setProblemQuery] = useState(
    initialQuery || userData.rights.problemQuery || ''
  );
  const [contextDetails, setContextDetails] = useState(
    userData.rights.contextDetails || ''
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RightsAnalysisResult | null>(
    userData.rights.result || null
  );
  const [checkedEvidence, setCheckedEvidence] = useState<Record<string, boolean>>({});
  const [showExampleModal, setShowExampleModal] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setProblemQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleQueryChange = (val: string) => {
    setProblemQuery(val);
    updateUserData('rights', { problemQuery: val });
  };

  const handleContextChange = (val: string) => {
    setContextDetails(val);
    updateUserData('rights', { contextDetails: val });
  };

  const handleUseExample = (sampleData: any) => {
    if (sampleData.problemQuery) {
      setProblemQuery(sampleData.problemQuery);
      updateUserData('rights', { problemQuery: sampleData.problemQuery });
    }
    if (sampleData.contextDetails) {
      setContextDetails(sampleData.contextDetails);
      updateUserData('rights', { contextDetails: sampleData.contextDetails });
    }
  };

  const handleAnalyze = async (queryToUse?: string, contextToUse?: string) => {
    const q = queryToUse || problemQuery;
    const ctx = contextToUse !== undefined ? contextToUse : contextDetails;
    if (!q.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    setCheckedEvidence({});

    try {
      const data = await CivicApiService.analyzeRights({
        userProblem: q,
        contextDetails: ctx,
        language
      });
      setResult(data);
      
        updateUserData('rights', { problemQuery: q, contextDetails: ctx, result: data });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleEvidence = (name: string) => {
    setCheckedEvidence(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center text-2xl border border-blue-500/20">
              âš–ï¸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                  {language === 'hi' ? 'à¤¨à¤¾à¤—à¤°à¤¿à¤• à¤à¤µà¤‚ à¤•à¤¾à¤¨à¥‚à¤¨à¥€ à¤…à¤§à¤¿à¤•à¤¾à¤° à¤¨à¥‡à¤µà¤¿à¤—à¥‡à¤Ÿà¤°' : 'Rights Navigator'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Grounded Statutory Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                {language === 'hi'
                  ? 'à¤…à¤ªà¤¨à¥€ à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤¬à¤¤à¤¾à¤à¤‚ à¤”à¤° à¤…à¤ªà¤¨à¥‡ à¤µà¥ˆà¤§à¤¾à¤¨à¤¿à¤• à¤…à¤§à¤¿à¤•à¤¾à¤°, à¤†à¤µà¤¶à¥à¤¯à¤• à¤¸à¤¾à¤•à¥à¤·à¥à¤¯ à¤¸à¥‚à¤šà¥€ à¤à¤µà¤‚ à¤šà¤°à¤£à¤¬à¤¦à¥à¤§ à¤¶à¤¿à¤•à¤¾à¤¯à¤¤ à¤ªà¥à¤°à¤•à¥à¤°à¤¿à¤¯à¤¾ à¤œà¤¾à¤¨à¥‡à¤‚à¥¤'
                  : 'Understand your statutory rights, assemble evidence, and follow the official escalation ladder.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-show-rights-example"
              onClick={() => setShowExampleModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 transition-colors shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span>{language === 'hi' ? 'à¤¸à¤®à¤¸à¥à¤¯à¤¾ à¤•à¤¾ à¤‰à¤¦à¤¾à¤¹à¤°à¤£ à¤¦à¥‡à¤–à¥‡à¤‚' : 'Show Problem Example'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'à¤…à¤ªà¤¨à¥€ à¤¸à¤®à¤¸à¥à¤¯à¤¾ à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£' : 'Describe your civic / legal grievance in normal words'}
            </label>
            <textarea
              id="rights-problem-input"
              rows={4}
              value={problemQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="e.g. My online purchase was defective and the seller refuses return..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'à¤…à¤¤à¤¿à¤°à¤¿à¤•à¥à¤¤ à¤¸à¤‚à¤¦à¤°à¥à¤­ / à¤²à¥‡à¤¨-à¤¦à¥‡à¤¨ à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£ (à¤µà¥ˆà¤•à¤²à¥à¤ªà¤¿à¤•)' : 'Supporting Context / Transaction Details (Optional)'}
            </label>
            <textarea
              rows={4}
              value={contextDetails}
              onChange={(e) => handleContextChange(e.target.value)}
              placeholder="e.g. Invoices, dates, agreement details, written notice sent, response received..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            id="btn-analyze-rights"
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !problemQuery.trim()}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Analyzing Statutory Rights & Escalation...</span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4 text-sky-300" />
                <span>Navigate My Rights & Next Steps</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results View */}
      {result && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 mb-8">
          
          {/* Top Classification & Authority Badge */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
                  Classified Legal Category:
                </span>
                <h2 className="text-xl font-bold text-white font-serif">
                  {result.problemCategory}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {result.confidence} CONFIDENCE
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 mt-4 leading-relaxed font-sans">
              {result.plainLanguageSummary}
            </p>
          </div>

          {/* Core Grounded 4-Pillars Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pillar 1: Verified Facts */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2 text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Legal Facts & Definitions:
              </h3>
              <ul className="space-y-2">
                {result.verifiedFacts.map((fact, i) => (
                  <li key={i} className="text-xs text-slate-800 flex items-start gap-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      âœ“
                    </span>
                    <span className="leading-relaxed">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pillar 2: Possible Interpretations */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2 text-blue-700">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Possible Legal Interpretations (Contextual):
              </h3>
              <ul className="space-y-2">
                {result.possibleInterpretations.map((interp, i) => (
                  <li key={i} className="text-xs text-slate-800 flex items-start gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      â„¹
                    </span>
                    <span className="leading-relaxed">{interp}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Applicable Acts & Sections */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-serif mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              Relevant Statutory Acts, Rules & Sections:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.relevantActsAndRules.map((rule, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-indigo-900">
                      {rule.actName}
                    </span>
                    {rule.sectionOrRule && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                        {rule.sectionOrRule}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mb-2 leading-relaxed">
                    {rule.simpleExplanation}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Source: {rule.officialSource}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Evidence Checklist */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Required Evidence Checklist for Action:
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tick off documents you have assembled before approaching the authority:
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {Object.values(checkedEvidence).filter(Boolean).length} / {result.evidenceChecklist.length} Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.evidenceChecklist.map((item, idx) => {
                const isChecked = !!checkedEvidence[item.name];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleEvidence(item.name)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400 bg-white'
                        }`}>
                          {isChecked && 'âœ“'}
                        </span>
                        {item.name}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        item.importance === 'essential' 
                          ? 'bg-red-100 text-red-800' 
                          : item.importance === 'recommended' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.importance}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-5 leading-snug">
                      {item.purpose}
                    </p>
                    {item.tip && (
                      <p className="text-[10px] text-slate-500 pl-5 mt-1 italic">
                        Tip: {item.tip}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Tier Escalation Ladder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-serif mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Step-by-Step Escalation Ladder:
            </h3>

            <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
              {result.escalationLadder.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pl-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 ring-4 ring-white shadow">
                    {step.level}
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-xs text-slate-900">
                        {step.stageName}: <span className="text-blue-900 font-semibold">{step.authority}</span>
                      </h4>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Clock className="w-3 h-3" />
                        Timeframe: {step.timeframe}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-2">
                      {step.procedure}
                    </p>
                    {step.officialLink && (
                      <a
                        href={step.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Visit Portal / File Complaint Online <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Verification Sources */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Authoritative Government Sources & Verification:
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {result.officialSources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 font-medium transition-colors"
                  >
                    <span>{src.title} ({src.authority})</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 max-w-xs italic">
              {result.disclaimer}
            </p>
          </div>

        </div>
      )}

      {/* Instructional Example Modal - Appears only when explicitly requested */}
      <ExampleModal
        isOpen={showExampleModal}
        onClose={() => setShowExampleModal(false)}
        tool="rights"
        language={language}
        onUseExample={handleUseExample}
      />

    </div>
  );
};

