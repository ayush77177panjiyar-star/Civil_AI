import React, { useState, useEffect } from 'react';
import { 
  BookOpenCheck, 
  Upload, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  HelpCircle, 
  Quote, 
  ShieldCheck,
  ArrowRight,
  FileSearch,
  ExternalLink,
  BookOpen,
  User,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Language, DocumentInterpretationResult } from '../types';
import { CivicApiService } from '../services/aiService';
import { t } from '../lib/i18n';
import { useUserData } from '../context/UserContext';
import { ExampleModal } from './ExampleModal';

interface DocumentInterpreterProps {
  language: Language;
  initialQuery?: string;
}

export const DocumentInterpreter: React.FC<DocumentInterpreterProps> = ({
  language,
  initialQuery = ''
}) => {
  const { userData, updateUserData, recordActivity } = useUserData();

  // Rule 1 & 7: Starts 100% empty for the real user
  const [docText, setDocText] = useState(userData.document.docText || '');
  const [docTitle, setDocTitle] = useState(userData.document.docTitle || '');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [result, setResult] = useState<DocumentInterpretationResult | null>(
    userData.document.result || null
  );
  const [showExampleModal, setShowExampleModal] = useState(false);

  useEffect(() => {
    if (initialQuery && !docText) {
      setDocText(initialQuery);
    }
  }, [initialQuery]);

  const handleTextChange = (val: string) => {
    setDocText(val);
    updateUserData('document', { docText: val });
  };

  const handleTitleChange = (val: string) => {
    setDocTitle(val);
    updateUserData('document', { docTitle: val });
  };

  const handleUseExample = (sampleData: any) => {
    if (sampleData.text) {
      setDocText(sampleData.text);
      updateUserData('document', { docText: sampleData.text });
    }
    if (sampleData.title) {
      setDocTitle(sampleData.title);
      updateUserData('document', { docTitle: sampleData.title });
    }
  };

  const handleInterpret = async (textToUse?: string, titleToUse?: string) => {
    const text = textToUse || docText;
    const title = titleToUse || docTitle;
    if (!text.trim()) return;

    setIsInterpreting(true);
    setResult(null);

    try {
      const data = await CivicApiService.interpretDocument({
        textContent: text,
        language
      });
      setResult(data);
      updateUserData('document', { docText: text, docTitle: title, result: data });
      recordActivity(
        'document_analysis',
        data.documentType || title || 'Document Analysis',
        'document',
        '📚',
        { title, textContent: text.slice(0, 100), result: data }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocTitle(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const textVal = content || '';
      setDocText(textVal);
      updateUserData('document', { docText: textVal, docTitle: file.name });
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-2xl shrink-0">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                {t('documentTool', language)}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 uppercase">
                OCR & Plain-Language Parser
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Paste or upload official notices, gazette notifications, or order copies to extract key deadlines, actions, and consequences.
            </p>
          </div>
        </div>

        {/* Rule 8: Show Document Example Button */}
        <button
          id="btn-show-document-example"
          onClick={() => setShowExampleModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Show Document Example</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Text Input / Upload Area */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Document Text / OCR Content
              </label>

              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Text/TXT File</span>
                <input
                  type="file"
                  accept=".txt,.md,.text"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Document Title or Reference No. (e.g. Municipal Reassessment Notice No. 8912)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-2"
              />

              <textarea
                id="document-input-text"
                rows={12}
                value={docText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Paste full document text here (e.g. official show-cause notice, gazette order, municipal demand notice)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {docText.length} characters entered
              </span>

              <button
                id="document-btn-interpret"
                onClick={() => handleInterpret()}
                disabled={isInterpreting || !docText.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-700 hover:bg-sky-800 text-white disabled:opacity-50 transition-all shadow-sm"
              >
                {isInterpreting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing Document...</span>
                  </>
                ) : (
                  <>
                    <span>Interpret Document</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Plain-Language Statutory Translation</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              CivicAI extracts legal deadlines, appeal windows, required evidence, and potential non-compliance penalties without legal jargon.
            </p>
          </div>

        </div>

        {/* Right Column: Interpretation Analysis Output */}
        <div className="lg:col-span-6">
          {result ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-5 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wider">
                    {result.documentType}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {docTitle || 'Analyzed Government Order'}
                  </h3>
                </div>

                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  OCR Quality: {result.ocrQuality}
                </span>
              </div>

              {/* Core Plain-Language Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileSearch className="w-4 h-4 text-sky-700" />
                  Core Plain-Language Summary:
                </h4>
                <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-sans font-medium">
                  {result.coreSummary}
                </p>
              </div>

              {/* Required Actions */}
              {result.requiredActions && result.requiredActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Mandated Citizen Actions:
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {result.requiredActions.map((act, i) => (
                      <li key={i} className="text-xs text-slate-800 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Deadlines */}
              {result.importantDatesAndDeadlines && result.importantDatesAndDeadlines.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-red-600" />
                    Critical Deadlines & Consequences:
                  </h4>
                  <div className="space-y-2">
                    {result.importantDatesAndDeadlines.map((dl, idx) => (
                      <div key={idx} className="p-3 bg-red-50/60 rounded-xl border border-red-200 text-xs text-red-900 flex items-start justify-between gap-2">
                        <div>
                          <strong className="font-bold block">{dl.event}</strong>
                          {dl.consequence && <span className="text-[11px] text-red-700 block mt-0.5">{dl.consequence}</span>}
                        </div>
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[11px] shrink-0">
                          {dl.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issuing Authority & Verification */}
              <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="text-slate-900">Issuing Department: </strong>
                  <span>{result.responsibleDepartment || result.officialSourceOrVerification?.issuingAuthority}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-100/70 border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
              <FileSearch className="w-12 h-12 text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">
                No Document Interpreted Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">
                Paste official document text on the left or click <strong>Show Document Example</strong> to see instructional guidance.
              </p>
              <button
                onClick={() => setShowExampleModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Show Document Example
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Instructional Example Modal */}
      <ExampleModal
        isOpen={showExampleModal}
        onClose={() => setShowExampleModal(false)}
        tool="document"
        language={language}
        onUseExample={handleUseExample}
      />
    </div>
  );
};
