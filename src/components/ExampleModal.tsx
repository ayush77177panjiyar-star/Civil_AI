import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  ArrowRight, 
  Check, 
  Copy, 
  Sparkles, 
  BookOpen, 
  Layers, 
  AlertCircle, 
  Info,
  RefreshCw
} from 'lucide-react';
import { Language } from '../types';
import { CivicExample, getExamplesForTool, getLocalizedExampleText } from '../data/civicExamples';
import { t } from '../lib/i18n';

interface ExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: 'rti' | 'rights' | 'scheme' | 'form' | 'document' | 'general';
  language: Language;
  onUseExample: (exampleData: any) => void;
  customTitle?: string;
}

export const ExampleModal: React.FC<ExampleModalProps> = ({
  isOpen,
  onClose,
  tool,
  language,
  onUseExample,
  customTitle
}) => {
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [dynamicAiExample, setDynamicAiExample] = useState<CivicExample | null>(null);

  if (!isOpen) return null;

  const baseExamples = getExamplesForTool(tool);
  const currentExampleList = dynamicAiExample ? [dynamicAiExample, ...baseExamples] : baseExamples;
  const currentExample = currentExampleList[selectedExampleIndex] || currentExampleList[0];

  const localized = getLocalizedExampleText(currentExample, language);

  const handleUseExample = () => {
    onUseExample(currentExample.sampleData);
    onClose();
  };

  const handleCopyText = () => {
    const textToCopy = currentExample.sampleData.problemQuery || 
                       currentExample.sampleData.query || 
                       currentExample.sampleData.text || 
                       localized.description;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateDynamicExample = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/civic/generate-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, language })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.example) {
          setDynamicAiExample(data.example);
          setSelectedExampleIndex(0);
        }
      }
    } catch (err) {
      console.warn('Could not generate dynamic example:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900">
        
        {/* Header with High-Contrast Clear Disclaimer Banner */}
        <div className="bg-amber-500/15 border-b border-amber-300/60 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-600 text-white shadow-2xs">
              EXAMPLE — NOT YOUR DATA
            </span>
            <span className="text-xs font-semibold text-amber-900 hidden sm:inline">
              Sample — For Guidance Only
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900">
                {customTitle || (
                  tool === 'rti' ? (language === 'hi' ? 'आरटीआई आवेदन उदाहरण' : 'RTI Problem Example') :
                  tool === 'rights' ? (language === 'hi' ? 'कानूनी अधिकार / विवाद उदाहरण' : 'Legal Grievance Example') :
                  tool === 'scheme' ? (language === 'hi' ? 'योजना पात्रता प्रोफ़ाइल उदाहरण' : 'Scheme Profile Example') :
                  tool === 'form' ? (language === 'hi' ? 'आवेदन पत्र उदाहरण' : 'Form Application Example') :
                  tool === 'document' ? (language === 'hi' ? 'सरकारी नोटिस उदाहरण' : 'Government Notice Example') :
                  (language === 'hi' ? 'नागरिक प्रश्न उदाहरण' : 'Civic Problem Example')
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hi'
                  ? 'यह एक उदाहरण है। आप इसे समझ सकते हैं या अपने संपादन के लिए उपयोग कर सकते हैं। यह आपकी निजी जानकारी के रूप में स्वतः सहेजा नहीं जाएगा।'
                  : 'This is a sample case for instructional guidance. You can review it or load it into your editor to customize. It will NOT be saved to your personal profile.'}
              </p>
            </div>

            {/* Language Pill */}
            <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shrink-0 uppercase">
              {language}
            </span>
          </div>

          {/* Example Selector Tabs if multiple */}
          {currentExampleList.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
              {currentExampleList.map((ex, idx) => (
                <button
                  key={ex.id || idx}
                  onClick={() => setSelectedExampleIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedExampleIndex === idx
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Scenario {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Selected Example Content Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Sample Scenario:
              </span>
              <button
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 font-serif leading-snug">
              {localized.title}
            </h3>

            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-line">
              {currentExample.sampleData.text || localized.description}
            </div>

            {/* Guidance statutory note */}
            {localized.notes && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Statutory Guidance:</strong>
                  <span>{localized.notes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Security & Privacy Notice */}
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span>
              <strong>Zero Auto-Save Guarantee:</strong> Clicking <em>Use This Example</em> only pastes text into the editor so you can edit it. Nothing is saved until you submit.
            </span>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="bg-white border-t border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-3">
          
          <button
            onClick={handleGenerateDynamicExample}
            disabled={isGeneratingAi}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
            title="Generate fresh sample using CivicAI"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isGeneratingAi ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAi ? 'Generating...' : 'Generate Another Example'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            <button
              id="btn-use-this-example"
              onClick={handleUseExample}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span>Use This Example</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
