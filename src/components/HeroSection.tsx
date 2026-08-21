import React, { useState, useRef } from 'react';
import { 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  BookOpen,
  RefreshCw,
  Send,
  Compass,
  Sparkles,
  Camera
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Language, ProblemRoutingResult } from '../types';
import { CivicApiService } from '../services/aiService';
import { t, SUPPORTED_LANGUAGES } from '../lib/i18n';
import { saveUserMessageToSupabase } from '../lib/supabase';
import { ExampleModal } from './ExampleModal';

interface HeroSectionProps {
  language: Language;
  onSelectTab: (tab: string, initialData?: any) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  language,
  onSelectTab
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [problemInput, setProblemInput] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [routingResult, setRoutingResult] = useState<ProblemRoutingResult | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(() => `conv_${Date.now()}`);
  const [followUpInput, setFollowUpInput] = useState('');
  const [showExampleModal, setShowExampleModal] = useState(false);

  // Screenshot state
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotStatus, setScreenshotStatus] = useState<string | null>(null);

  // Supabase message save status toast state
  const [saveConfirmation, setSaveConfirmation] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const quickQuestions = [
    { label: 'What is RTI?', query: 'What is RTI?' },
    { label: 'What is a consumer complaint?', query: 'What is a consumer complaint?' },
    { label: 'What is myScheme?', query: 'What is myScheme?' },
    { label: 'What does Public Authority mean?', query: 'What does Public Authority mean in India?' },
    { label: 'How can I file an RTI?', query: 'How can I file an RTI application in India?' }
  ];

  const handleTakeScreenshot = async () => {
    if (isCapturingScreenshot || !heroRef.current) return;
    setIsCapturingScreenshot(true);
    setScreenshotStatus(null);

    try {
      const canvas = await html2canvas(heroRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        scale: window.devicePixelRatio && window.devicePixelRatio > 1 ? window.devicePixelRatio : 2,
        ignoreElements: (element) => {
          return element.id === 'hero-screenshot-btn' || element.id === 'save-confirmation-toast';
        }
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `CivicAI_Hero_Screenshot_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setScreenshotStatus('Screenshot generated successfully');
      setTimeout(() => setScreenshotStatus(null), 3500);
    } catch (err: any) {
      console.error('Screenshot capture failed:', err);
      setScreenshotStatus('Your screenshot could not be captured. Please try again.');
      setTimeout(() => setScreenshotStatus(null), 4000);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleAnalyze = async (textToAnalyze?: string) => {
    const query = textToAnalyze || problemInput;
    if (!query.trim() || isRouting) return;

    setIsRouting(true);
    setRoutingError(null);
    setSaveConfirmation(null);

    // Step 4 & 5: Persist user's message into Supabase and WAIT for response
    try {
      const persistRes = await saveUserMessageToSupabase(query, conversationId);
      if (persistRes.success) {
        // Step 6: Show "Message saved successfully" ONLY AFTER Supabase confirms successful insertion
        setSaveConfirmation({
          type: 'success',
          text: 'Message saved successfully'
        });
      } else {
        setSaveConfirmation({
          type: 'error',
          text: 'Your message could not be saved. Please try again.'
        });
      }
    } catch (err) {
      setSaveConfirmation({
        type: 'error',
        text: 'Your message could not be saved. Please try again.'
      });
    }

    setTimeout(() => {
      setSaveConfirmation(null);
    }, 4000);

    // Step 7: Continue existing AI response flow
    try {
      const data = await CivicApiService.routeProblem(query, language, undefined, conversationId);
      setRoutingResult(data);
      setFollowUpInput('');
    } catch (err: any) {
      console.error('Routing error:', err);
      setRoutingError(err?.message || 'Unable to route civic query.');
    } finally {
      setIsRouting(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim() || isRouting) return;
    const q = followUpInput;
    setFollowUpInput('');
    await handleAnalyze(q);
  };

  const handleReset = () => {
    setProblemInput('');
    setRoutingResult(null);
    setRoutingError(null);
    setSaveConfirmation(null);
    setConversationId(`conv_${Date.now()}`);
  };

  const handleUseExample = (sampleData: any) => {
    const textToCopy = sampleData.query || sampleData.problemQuery || sampleData.text || '';
    if (textToCopy) {
      setProblemInput(textToCopy);
    }
  };

  return (
    <div ref={heroRef} className="bg-slate-900 text-white min-h-[70vh] flex flex-col justify-between p-6 sm:p-10 border-b border-slate-800 relative overflow-hidden">
      
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full relative z-10">
        
        {/* Top Header Badge & Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-sky-400 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CivicAI Grounded Legal & Welfare Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            {/* Safe Hero Screenshot Button */}
            <button
              id="hero-screenshot-btn"
              onClick={handleTakeScreenshot}
              disabled={isCapturingScreenshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              title="Capture a screenshot of the Hero section"
            >
              {isCapturingScreenshot ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                  <span>Capturing...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                  <span>Screenshot</span>
                </>
              )}
            </button>

            {/* Instructional Examples Button */}
            <button
              onClick={() => setShowExampleModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-800/80 hover:bg-amber-900/80 transition-all shadow-xs"
              title="See instructional examples on how to use CivicAI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Try an Example</span>
            </button>
          </div>
        </div>


        {/* Hero Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight text-white mb-3 leading-tight">
            How can I help you today?
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed font-sans">
            State your civic problem, welfare query, or legal concern in plain language. CivicAI routes you directly to verified statutory frameworks, official portals, and dedicated tools.
          </p>
        </div>

        {/* Main Clean Input Box */}
        <div className="bg-slate-800/90 border-2 border-slate-700 focus-within:border-blue-500 rounded-2xl p-3 shadow-2xl transition-all mb-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
            <textarea
              id="hero-input-problem"
              rows={2}
              value={problemInput}
              onChange={(e) => setProblemInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
              placeholder={t('searchPlaceholder', language)}
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/80 mt-2 px-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              Press Enter to analyze or click Analyze Problem
            </span>

            <button
              id="hero-btn-analyze"
              onClick={() => handleAnalyze()}
              disabled={isRouting || !problemInput.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-all shadow-md"
            >
              {isRouting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>{t('analyzeProblem', language)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Screenshot feedback notification */}
        {screenshotStatus && (
          <div className="mb-4 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 bg-slate-800 border border-slate-700 text-sky-300 animate-in fade-in duration-200 shadow-md">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-400" />
              <span>{screenshotStatus}</span>
            </div>
            <button
              onClick={() => setScreenshotStatus(null)}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Non-intrusive Supabase Message Save Confirmation Toast */}
        {saveConfirmation && (
          <div
            id="save-confirmation-toast"
            className={`mb-4 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-md ${
              saveConfirmation.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/80'
                : 'bg-red-950/90 text-red-300 border border-red-800/80'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              {saveConfirmation.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{saveConfirmation.text}</span>
            </div>
            <button
              onClick={() => setSaveConfirmation(null)}
              className="text-[11px] opacity-70 hover:opacity-100 underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Informational Prompts */}

        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs text-slate-400 font-semibold mr-1">Common Questions:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setProblemInput(q.query);
                handleAnalyze(q.query);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {routingError && (
          <div className="bg-red-950/80 border border-red-800 text-red-200 p-4 rounded-xl mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-white mb-1">Service Notification</p>
              <p className="text-xs text-red-200">{routingError}</p>
            </div>
            <button
              onClick={() => setRoutingError(null)}
              className="text-xs text-red-300 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Grounded Router / Direct Answer Result Card */}
        {routingResult && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-800 border-2 border-blue-500/80 rounded-2xl p-5 shadow-2xl mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-lg">
                  {routingResult.recommendedTool === 'rti' && 'RTI'}
                  {routingResult.recommendedTool === 'rights' && 'Legal'}
                  {routingResult.recommendedTool === 'scheme' && 'Welfare'}
                  {routingResult.recommendedTool === 'form' && 'Form'}
                  {routingResult.recommendedTool === 'document' && 'Doc'}
                  {(!routingResult.recommendedTool || routingResult.recommendedTool === 'none') && 'AI'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                      {routingResult.intent === 'INFORMATION' 
                        ? 'Direct Civic Answer' 
                        : (routingResult.intent === 'GENERAL_CONVERSATION' 
                            ? 'CivicAI Assistant' 
                            : 'Grounded Category Detected')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      {routingResult.confidence} CONFIDENCE
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-serif">
                    {routingResult.categoryLabel}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {routingResult.requiresTool && routingResult.recommendedTool && routingResult.recommendedTool !== 'none' && (
                  <button
                    onClick={() => onSelectTab(routingResult.recommendedTool as string, { query: problemInput, routerData: routingResult })}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
                  >
                    <span>Launch Dedicated Tool</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="New Query / Reset"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Answer Box */}
            {routingResult.directAnswer && (
              <div className="bg-slate-900/90 p-4 rounded-xl border border-blue-900/60 mb-4">
                <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  Direct Answer & Explanation:
                </h4>
                <div className="text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-line">
                  {routingResult.directAnswer}
                </div>
              </div>
            )}

            {/* Clarification Box if needed */}
            {routingResult.requiresClarification && routingResult.clarificationQuestion && (
              <div className="bg-amber-950/70 p-3.5 rounded-xl border border-amber-800/80 mb-4 flex items-start gap-3">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                    Clarification Needed:
                  </h4>
                  <p className="text-xs text-amber-100 leading-relaxed font-sans">
                    {routingResult.clarificationQuestion}
                  </p>
                </div>
              </div>
            )}

            {/* Follow-up Action Chips */}
            {routingResult.followUpActions && routingResult.followUpActions.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  Suggested Next Steps:
                </span>
                {routingResult.followUpActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (action.actionType === 'tool' && action.targetTool) {
                        onSelectTab(action.targetTool, { query: problemInput, routerData: routingResult });
                      } else if (action.targetQuery) {
                        handleAnalyze(action.targetQuery);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
                  >
                    <span>{action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Structured Action breakdown if not pure conversation */}
            {routingResult.intent !== 'GENERAL_CONVERSATION' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700/60">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Statutory Framework & Grounding:
                  </h4>
                  <p className="text-xs text-slate-300 mb-2 leading-relaxed font-sans">
                    {routingResult.summary}
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    "{routingResult.reasoning}"
                  </p>
                </div>

                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700/60">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ArrowRight className="w-4 h-4 text-sky-400" />
                    Recommended Action Checklist:
                  </h4>
                  <ul className="space-y-1.5">
                    {routingResult.suggestedSteps.map((step, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Official Sources Cited */}
            {routingResult.officialSources && routingResult.officialSources.length > 0 && (
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Official Government Portals:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {routingResult.officialSources.map((src: any, idx: number) => (
                    <a
                      key={idx}
                      href={src.portalUrl || src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 border border-slate-700 transition-colors"
                    >
                      <span>{src.name || src.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-turn Follow-up Input */}
            <form onSubmit={handleFollowUpSubmit} className="pt-3 border-t border-slate-700/80 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  placeholder="Ask a follow-up question (e.g., 'Can I use it against my municipality?', 'What documents do I need?')..."
                  className="w-full bg-slate-900 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isRouting || !followUpInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Instructional Guidance Example Modal */}
      <ExampleModal
        isOpen={showExampleModal}
        onClose={() => setShowExampleModal(false)}
        tool="general"
        language={language}
        onUseExample={handleUseExample}
      />
    </div>
  );
};
