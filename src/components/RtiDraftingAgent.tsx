import { INDIAN_STATES_AND_UTS } from '../data/indianStates';
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Copy, 
  RotateCcw, 
  ExternalLink, 
  Edit3, 
  Send,
  HelpCircle,
  Building2,
  ShieldCheck,
  Check,
  ChevronRight,
  Info,
  User,
  BookOpen
} from 'lucide-react';
import { Language, RtiAnalysisResponse, RtiDraftData } from '../types';
import { generateRtiPdf } from '../lib/pdfGenerator';
import { OFFICIAL_PORTALS } from '../data/officialSources';
import { CivicApiService } from '../services/aiService';
import { t } from '../lib/i18n';
import { useUserData } from '../context/UserContext';
import { ExampleModal } from './ExampleModal';

interface RtiDraftingAgentProps {
  language: Language;
  initialQuery?: string;
}

export const RtiDraftingAgent: React.FC<RtiDraftingAgentProps> = ({
  language,
  initialQuery = ''
}) => {
  const { userData, updateUserData } = useUserData();

  // All fields start empty by default for the real user
  const [problemQuery, setProblemQuery] = useState(
    initialQuery || userData.rti.problemQuery || ''
  );
  const [stateOrUt, setStateOrUt] = useState(
    userData.rti.stateOrUt || ''
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<RtiAnalysisResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(userData.rti.answers || {});
  const [applicantDetails, setApplicantDetails] = useState(
    userData.rti.applicantDetails || { name: '', address: '', phone: '', email: '' }
  );
  const [generatedDraft, setGeneratedDraft] = useState<RtiDraftData | null>(
    userData.rti.generatedDraft || null
  );
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setProblemQuery(initialQuery);
    }
  }, [initialQuery]);

  // Persist changes to real user storage
  const handleQueryChange = (val: string) => {
    setProblemQuery(val);
    updateUserData('rti', { problemQuery: val });
  };

  const handleStateChange = (val: string) => {
    setStateOrUt(val);
    updateUserData('rti', { stateOrUt: val });
  };

  const handleApplicantChange = (field: keyof typeof applicantDetails, val: string) => {
    const next = { ...applicantDetails, [field]: val };
    setApplicantDetails(next);
    updateUserData('rti', { applicantDetails: next });
  };

  const handleUseExample = (sampleData: any) => {
    if (sampleData.problemQuery) {
      setProblemQuery(sampleData.problemQuery);
      updateUserData('rti', { problemQuery: sampleData.problemQuery });
    }
    if (sampleData.stateOrUt && sampleData.stateOrUt !== 'National / Any State') {
      setStateOrUt(sampleData.stateOrUt);
      updateUserData('rti', { stateOrUt: sampleData.stateOrUt });
    }
  };

  const handleAnalyze = async (queryToUse?: string, stateToUse?: string) => {
    const q = queryToUse || problemQuery;
    const st = stateToUse || stateOrUt;
    if (!q.trim()) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    setGeneratedDraft(null);

    try {
      const data = await CivicApiService.analyzeRti(q, st, language);
      setAnalysis(data);
      
      // Pre-fill default answers placeholder
      const initialAns: Record<string, string> = {};
      if (data.clarificationQuestions) {
        data.clarificationQuestions.forEach((cq: any) => {
          if (cq.suggestedValues && cq.suggestedValues.length > 0) {
            initialAns[cq.id] = cq.suggestedValues[0];
          } else {
            initialAns[cq.id] = '';
          }
        });
      }
      setAnswers(initialAns);
      updateUserData('rti', { answers: initialAns });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCompleteDraft = async () => {
    if (!analysis) return;
    setIsGenerating(true);

    try {
      const draftData = await CivicApiService.generateRtiDraft({
        userProblem: problemQuery,
        answers,
        applicantDetails,
        isCentralAuthority: analysis.isCentralAuthority,
        likelyAuthority: analysis.likelyAuthority,
        stateOrUt,
        language
      });
      setGeneratedDraft(draftData);
      updateUserData('rti', { generatedDraft: draftData });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    const text = `
APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

To,
The Public Information Officer (PIO / SPIO / CPIO)
${generatedDraft.publicAuthority || generatedDraft.department}
${generatedDraft.pioAddress}

Subject: ${generatedDraft.subject}

1. Applicant Details:
Name: ${generatedDraft.applicantName}
Address: ${generatedDraft.applicantAddress}
Phone: ${generatedDraft.applicantPhone || 'N/A'}
Email: ${generatedDraft.applicantEmail || 'N/A'}

2. Particulars of Information Sought under Section 6(1):
${generatedDraft.informationPoints.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

3. Relevant Period:
${generatedDraft.periodFrom || 'Sanction Date'} to ${generatedDraft.periodTo || 'Current Date'}

4. Fee & Statutory Declarations:
${generatedDraft.feeDetails}
${generatedDraft.declaration}

Date: ${new Date().toLocaleDateString('en-IN')}
Signature: __________________________
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    if (!generatedDraft) return;
    generateRtiPdf(generatedDraft);
  };

  const handleReset = () => {
    setAnalysis(null);
    setGeneratedDraft(null);
    setIsEditingDraft(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-2xl border border-amber-500/20">
              ðŸ“
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                  {language === 'hi' ? 'à¤†à¤°à¤Ÿà¥€à¤†à¤ˆ à¤¡à¥à¤°à¤¾à¤«à¥à¤Ÿà¤¿à¤‚à¤— à¤à¤œà¥‡à¤‚à¤Ÿ' : 'RTI Drafting Agent'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  RTI Act 2005 Grounded
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                {language === 'hi'
                  ? 'à¤…à¤ªà¤¨à¥‡ à¤ªà¥à¤°à¤¶à¥à¤¨à¥‹à¤‚ à¤•à¥‹ à¤ à¥‹à¤¸, à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤ à¤¸à¤°à¤•à¤¾à¤°à¥€ à¤°à¤¿à¤•à¥‰à¤°à¥à¤¡ à¤”à¤° à¤µà¤¾à¤‰à¤šà¤° à¤®à¤¾à¤‚à¤—à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ à¤•à¤¾à¤¨à¥‚à¤¨à¥€ à¤†à¤°à¤Ÿà¥€à¤†à¤ˆ à¤†à¤µà¥‡à¤¦à¤¨ à¤®à¥‡à¤‚ à¤¬à¤¦à¤²à¥‡à¤‚à¥¤'
                  : 'Convert informal queries into professional record-seeking requests for sanction orders, measurement books & vouchers.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-show-rti-example"
              onClick={() => setShowExampleModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'hi' ? 'RTI à¤‰à¤¦à¤¾à¤¹à¤°à¤£ à¤¦à¥‡à¤–à¥‡à¤‚' : 'Show RTI Example'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Citizen Query Input */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'à¤…à¤ªà¤¨à¥€ à¤¸à¤®à¤¸à¥à¤¯à¤¾ / à¤®à¤¾à¤‚à¤—à¥€ à¤œà¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¥€ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€' : 'What information are you trying to obtain?'}
            </label>
            <textarea
              id="rti-user-query"
              rows={3}
              value={problemQuery}
              onChange={(e) => setProblemQuery(e.target.value)}
              placeholder="e.g. My village road was sanctioned in 2023 but no work done. I want to inspect sanction order, fund allocation and contractor payments..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'à¤°à¤¾à¤œà¥à¤¯ / à¤•à¥‡à¤‚à¤¦à¥à¤° à¤¶à¤¾à¤¸à¤¿à¤¤ à¤ªà¥à¤°à¤¦à¥‡à¤¶' : 'State / Union Territory'}
            </label>
            <select
              value={stateOrUt}
              onChange={(e) => setStateOrUt(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3"
            >
              <option value="">Select State / Union Territory...</option>
              <option value="Central Government (PAN India)">Central Government Department</option>
              {INDIAN_STATES_AND_UTS.map(region => (
                <option key={region.name} value={region.name}>
                  {region.name}{region.type === 'UNION_TERRITORY' ? ' (UT)' : ''}
                </option>
              ))}
            </select>

            <button
              id="btn-analyze-rti"
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !problemQuery.trim()}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Analyzing Objectives...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Analyze & Identify Authority</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Jurisdiction & Clarification Stage */}
      {analysis && !generatedDraft && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 mb-8">
          
          {/* Central vs State Warning Box */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            analysis.isCentralAuthority 
              ? 'bg-blue-50 border-blue-200 text-blue-900' 
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
              analysis.isCentralAuthority ? 'text-blue-600' : 'text-amber-600'
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm font-serif">
                  {analysis.isCentralAuthority 
                    ? 'Central Public Authority Detected' 
                    : 'State Government / Local Authority Jurisdiction Notice'}
                </h3>
                <span className={`px-2 py-0.2 text-[10px] font-bold rounded ${
                  analysis.isCentralAuthority ? 'bg-blue-200 text-blue-800' : 'bg-amber-200 text-amber-800'
                }`}>
                  {analysis.isCentralAuthority ? 'Central RTI' : 'State / Local RTI'}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed">
                {analysis.officialPortalInfo.stateWarning || analysis.officialPortalInfo.guidance}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
                <span>Official Destination:</span>
                <a
                  href={analysis.officialPortalInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-700 hover:underline font-bold"
                >
                  {analysis.officialPortalInfo.name} ({analysis.officialPortalInfo.url})
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Analysis Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 font-serif mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              RTI Objective & Public Authority Identified:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Citizen Objective:
                </span>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {analysis.objective}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Likely Public Authority / Department:
                </span>
                <p className="text-xs font-bold text-blue-900">
                  {analysis.likelyAuthority}
                </p>
                <span className="text-[11px] text-slate-500">
                  Jurisdiction: {analysis.stateOrUt || 'State'} Government Body
                </span>
              </div>
            </div>

            

            {/* Targeted Missing Questions */}
            {analysis.clarificationQuestions && analysis.clarificationQuestions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Clarify Specific Details for a Strong, Actionable RTI:
                  </h4>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  The RTI Act under Section 6(1) requires specific identification of records. Please answer or modify these parameters:
                </p>

                <div className="space-y-3">
                  {analysis.clarificationQuestions.map((q) => (
                    <div key={q.id} className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        {q.question}
                      </label>
                      <span className="block text-[11px] text-slate-500 mb-2 italic">
                        Why this is needed: {q.reason}
                      </span>
                      <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => {
                          const next = { ...answers, [q.id]: e.target.value };
                          setAnswers(next);
                          updateUserData('rti', { answers: next });
                        }}
                        placeholder={q.placeholder || 'Enter specific details...'}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applicant Details */}
            <div className="mb-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Applicant Details (Mandatory under Section 6(1)):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Applicant Name</label>
                  <input
                    type="text"
                    value={applicantDetails.name}
                    onChange={(e) => handleApplicantChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={applicantDetails.phone}
                    onChange={(e) => handleApplicantChange('phone', e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Postal Address for Reply</label>
                  <input
                    type="text"
                    value={applicantDetails.address}
                    onChange={(e) => handleApplicantChange('address', e.target.value)}
                    placeholder="Full residential postal address with PIN code"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Submit to Generate Draft */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel / Re-enter
              </button>
              <button
                id="btn-generate-rti-draft"
                onClick={handleGenerateCompleteDraft}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md flex items-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Drafting Legal RTI Application...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Generate Structured RTI Draft</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Step 3: Fully Structured RTI Draft View & In-Place Editor */}
      {generatedDraft && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
          
          {/* Action Toolbar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span className="text-sm font-bold font-serif">RTI Application Draft Ready</span>
              <span className="text-xs text-slate-400">| Formatted under Section 6(1) RTI Act 2005</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsEditingDraft(!isEditingDraft)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                <span>{isEditingDraft ? 'Done Editing' : 'Edit Draft'}</span>
              </button>

              <button
                id="btn-copy-rti"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                id="btn-download-rti-pdf"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start Again</span>
              </button>
            </div>
          </div>

          {/* Submission Pathway Advisory Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Official Submission Route Guidance:
              </h4>
              <p className="text-xs mt-1 leading-relaxed">
                {generatedDraft.officialRouteNote}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">Official Portal Link:</span>
                <a
                  href={generatedDraft.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                >
                  {generatedDraft.officialPortalName} ({generatedDraft.officialPortalUrl})
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Paper Style Printable Layout */}
          <div className="bg-white rounded-2xl p-8 border border-slate-300 shadow-xl font-serif text-slate-900 text-sm leading-relaxed max-w-4xl mx-auto ring-1 ring-black/5">
            
            <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
              <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase">
                Application Seeking Certified Information
              </h2>
              <p className="text-xs font-sans text-slate-600">
                Under Section 6(1) of the Right to Information Act, 2005
              </p>
            </div>

            {/* To PIO */}
            <div className="mb-6 font-sans">
              <p className="font-bold text-xs uppercase text-slate-600 mb-1">To,</p>
              {isEditingDraft ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={generatedDraft.pioDesignation}
                    onChange={(e) => setGeneratedDraft({ ...generatedDraft, pioDesignation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    value={generatedDraft.publicAuthority}
                    onChange={(e) => setGeneratedDraft({ ...generatedDraft, publicAuthority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    value={generatedDraft.pioAddress}
                    onChange={(e) => setGeneratedDraft({ ...generatedDraft, pioAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-800 space-y-0.5">
                  <p className="font-bold">{generatedDraft.pioDesignation}</p>
                  <p className="font-medium">{generatedDraft.publicAuthority || generatedDraft.department}</p>
                  <p className="text-slate-600">{generatedDraft.pioAddress}</p>
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="mb-6 font-sans bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-xs text-slate-700">Subject: </span>
              {isEditingDraft ? (
                <input
                  type="text"
                  value={generatedDraft.subject}
                  onChange={(e) => setGeneratedDraft({ ...generatedDraft, subject: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs mt-1"
                />
              ) : (
                <span className="text-xs font-semibold text-slate-900">{generatedDraft.subject}</span>
              )}
            </div>

            {/* Applicant Details */}
            <div className="mb-6 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Particulars of the Applicant:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800 pl-4 border-l-2 border-slate-300">
                <p><strong className="text-slate-600">Full Name:</strong> {generatedDraft.applicantName}</p>
                <p><strong className="text-slate-600">Contact:</strong> {generatedDraft.applicantPhone || 'N/A'}</p>
                <p className="sm:col-span-2"><strong className="text-slate-600">Postal Address:</strong> {generatedDraft.applicantAddress}</p>
              </div>
            </div>

            {/* Numbered Certified Information Points */}
            <div className="mb-6 font-sans">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Particulars of Information Sought under Section 6(1):
              </h4>
              <p className="text-xs text-slate-500 mb-3 pl-4">
                Kindly provide certified true copies / inspection of the following official public records:
              </p>

              {isEditingDraft ? (
                <div className="space-y-2 pl-4">
                  {generatedDraft.informationPoints.map((pt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-xs font-bold text-slate-500 mt-1">{idx + 1}.</span>
                      <textarea
                        rows={2}
                        value={pt}
                        onChange={(e) => {
                          const updated = [...generatedDraft.informationPoints];
                          updated[idx] = e.target.value;
                          setGeneratedDraft({ ...generatedDraft, informationPoints: updated });
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-sans"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ol className="space-y-3 pl-4 text-xs text-slate-900">
                  {generatedDraft.informationPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Period */}
            {(generatedDraft.periodFrom || generatedDraft.periodTo) && (
              <div className="mb-6 font-sans text-xs pl-4 border-l-2 border-slate-300">
                <span className="font-bold text-slate-700">3. Relevant Period: </span>
                <span className="text-slate-900">{generatedDraft.periodFrom || 'Sanction'} to {generatedDraft.periodTo || 'Current date'}</span>
              </div>
            )}

            {/* Declarations & Fee */}
            <div className="mb-8 font-sans space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p>
                <strong className="text-slate-900">4. Application Fee: </strong>
                {generatedDraft.feeDetails}
              </p>
              <p>
                <strong className="text-slate-900">5. Citizen Declaration: </strong>
                {generatedDraft.declaration}
              </p>
              <p className="text-[11px] text-slate-500 italic">
                (Note: Under Section 6(2) of the RTI Act 2005, an applicant making request for information shall not be required to give any reason for requesting the information.)
              </p>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs font-sans text-slate-700">
              <div>
                <p><strong>Place:</strong> {generatedDraft.stateOrUt || 'India'}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
              </div>

              <div className="text-right mt-4 sm:mt-0">
                <div className="h-10"></div>
                <p className="border-t border-slate-400 pt-1 font-bold">
                  {generatedDraft.applicantName}
                </p>
                <p className="text-[11px] text-slate-500">(Signature of Applicant)</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Instructional Example Modal - Appears only when explicitly requested by citizen */}
      <ExampleModal
        isOpen={showExampleModal}
        onClose={() => setShowExampleModal(false)}
        tool="rti"
        language={language}
        onUseExample={handleUseExample}
      />

    </div>
  );
};

