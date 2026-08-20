import React, { useState } from 'react';
import { 
  FormInput, 
  Send, 
  Download, 
  Copy, 
  RotateCcw, 
  CheckCircle2, 
  Edit3, 
  FileText, 
  Check, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  User,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { Language, FormTemplate } from '../types';
import { generateGenericDocumentPdf } from '../lib/pdfGenerator';
import { CivicApiService } from '../services/aiService';
import { t } from '../lib/i18n';
import { useUserData } from '../context/UserContext';
import { ExampleModal } from './ExampleModal';

interface ConversationalFormFillerProps {
  language: Language;
  initialQuery?: string;
}

const PRESET_TEMPLATES: FormTemplate[] = [
  {
    id: 'income-cert',
    title: 'Income Certificate Application Representation',
    titleHi: 'आय प्रमाण पत्र आवेदन',
    department: 'Revenue Department / Office of the Tehsildar & Sub-Divisional Magistrate',
    category: 'Certificates',
    description: 'Official representation requesting issuance of Annual Family Income Certificate for fee concessions & scholarships.',
    officialAuthority: 'The Tehsildar / Sub-Divisional Magistrate (Revenue)',
    fields: [
      { id: 'applicantName', label: 'Full Name of Applicant', type: 'text', required: true, explanation: 'Full legal name matching Aadhaar Card.', sampleValue: 'Rahul Kumar' },
      { id: 'fatherOrHusbandName', label: "Father's / Husband's Name", type: 'text', required: true, explanation: 'Guardian name for revenue records.', sampleValue: 'Shri Ramesh Kumar' },
      { id: 'residentialAddress', label: 'Complete Residential Address', type: 'textarea', required: true, explanation: 'Village/Town, Post, Police Station, District and PIN.', sampleValue: 'Village Rampur, Post Sadar, Dist. Patna - 800001' },
      { id: 'annualIncome', label: 'Total Annual Family Income (Rs.)', type: 'number', required: true, explanation: 'Combined annual income from all sources.', sampleValue: '250000' },
      { id: 'incomeSources', label: 'Primary Sources of Income', type: 'text', required: true, explanation: 'e.g., Agriculture, Private job, Daily wage, Small business.', sampleValue: 'Agriculture & Small Grocery Shop' },
      { id: 'purpose', label: 'Purpose of Certificate', type: 'text', required: true, explanation: 'Why is the certificate needed?', sampleValue: 'Post-Matric Higher Education Scholarship Application' }
    ]
  },
  {
    id: 'grievance-dm',
    title: 'Public Grievance Representation to District Magistrate',
    titleHi: 'जिलाधिकारी को जन शिकायत आवेदन',
    department: 'District Administration / Collectorate',
    category: 'Grievances',
    description: 'Formal citizen representation for unresolved public issues, delayed administrative services, or local infrastructure negligence.',
    officialAuthority: 'The District Magistrate & Collector',
    fields: [
      { id: 'applicantName', label: 'Citizen Name', type: 'text', required: true, explanation: 'Your full name.', sampleValue: 'Anita Devi' },
      { id: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true, explanation: '10-digit mobile number.', sampleValue: '9876543210' },
      { id: 'residentialAddress', label: 'Locality & Address', type: 'textarea', required: true, explanation: 'Address where the issue is situated.', sampleValue: 'Ward No. 12, Main Road, Block Sadar' },
      { id: 'grievanceSubject', label: 'Subject of Grievance', type: 'text', required: true, explanation: 'One line summary of grievance.', sampleValue: 'Non-repair of main drinking water pipeline for 45 days' },
      { id: 'previousComplaintRef', label: 'Previous Complaint Reference / Dates', type: 'text', required: false, explanation: 'Prior ticket numbers or dates.', sampleValue: 'Complaint No. MUNIC-2026-9812 dated 10 Jan 2026' },
      { id: 'specificPrayer', label: 'Specific Relief / Action Requested', type: 'textarea', required: true, explanation: 'What exact action are you requesting the DM to order?', sampleValue: 'Immediate inspection by Junior Engineer and restoration of clean drinking water supply.' }
    ]
  },
  {
    id: 'consumer-notice',
    title: 'Legal Notice / Grievance to Defective Product Seller',
    titleHi: 'विक्रेता को कानूनी नोटिस',
    department: 'Consumer Disputes & Voluntary Notice',
    category: 'Consumer Protection',
    description: 'Pre-litigation formal demand notice to e-commerce seller/service provider under Section 2(11) of Consumer Protection Act 2019.',
    officialAuthority: 'M/s [Seller Name / Customer Grievance Officer]',
    fields: [
      { id: 'applicantName', label: 'Consumer Full Name', type: 'text', required: true, explanation: 'Name on the purchase invoice.', sampleValue: 'Vikas Sharma' },
      { id: 'sellerName', label: 'Company / Seller Name', type: 'text', required: true, explanation: 'Name of store or e-commerce merchant.', sampleValue: 'ElectroGadgets India Pvt Ltd' },
      { id: 'invoiceDetails', label: 'Invoice No. & Date', type: 'text', required: true, explanation: 'Bill number and date of transaction.', sampleValue: 'INV-2026-88741 dated 15 Jan 2026' },
      { id: 'amountPaid', label: 'Amount Paid (Rs.)', type: 'number', required: true, explanation: 'Total transaction value.', sampleValue: '18500' },
      { id: 'defectSummary', label: 'Summary of Defect / Failure', type: 'textarea', required: true, explanation: 'Describe why item is defective or service deficient.', sampleValue: 'Product was delivered damaged, not functioning, and return request was rejected arbitrarily.' },
      { id: 'settlementDemand', label: 'Demand (Refund / Replacement)', type: 'text', required: true, explanation: 'Specify 7-day refund or replacement demand.', sampleValue: 'Full refund of Rs. 18,500 along with Rs. 2,000 incidental compensation within 7 days.' }
    ]
  }
];

export const ConversationalFormFiller: React.FC<ConversationalFormFillerProps> = ({
  language,
  initialQuery = ''
}) => {
  const { userData, updateUserData } = useUserData();

  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate>(() => {
    const targetId = userData.form.selectedTemplateId || 'income-cert';
    return PRESET_TEMPLATES.find(t => t.id === targetId) || PRESET_TEMPLATES[0];
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Rule 1 & 7: Form fields start 100% empty for the real user
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    return userData.form.answers || {};
  });
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(
    userData.form.generatedDocumentText || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [isEditingAnswers, setIsEditingAnswers] = useState(false);

  const currentField = selectedTemplate.fields[currentStepIndex];

  const handleAnswerChange = (fieldId: string, val: string) => {
    const next = { ...answers, [fieldId]: val };
    setAnswers(next);
    updateUserData('form', { answers: next, selectedTemplateId: selectedTemplate.id });
  };

  const handleUseExample = (sampleData: any) => {
    if (sampleData.templateId) {
      const found = PRESET_TEMPLATES.find(t => t.id === sampleData.templateId);
      if (found) setSelectedTemplate(found);
    }
    const sampleAnswers: Record<string, string> = {
      applicantName: sampleData.applicantName || 'Citizen Name (Sample)',
      purpose: sampleData.purpose || 'Scholarship Application',
      annualIncome: sampleData.annualIncome || '180000',
      residentialAddress: sampleData.district || 'District Center'
    };
    setAnswers(sampleAnswers);
    updateUserData('form', { answers: sampleAnswers });
    if (selectedTemplate.fields[0]) {
      setCurrentInput(sampleAnswers[selectedTemplate.fields[0].id] || '');
    }
  };

  const handleNextStep = (inputVal?: string) => {
    const val = inputVal !== undefined ? inputVal : currentInput;
    if (currentField) {
      if (val.trim() || !currentField.required) {
        const nextVal = val.trim() || answers[currentField.id] || '';
        handleAnswerChange(currentField.id, nextVal);
      }
    }

    if (currentStepIndex < selectedTemplate.fields.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      const nextField = selectedTemplate.fields[currentStepIndex + 1];
      setCurrentInput(answers[nextField.id] || '');
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      const prevField = selectedTemplate.fields[currentStepIndex - 1];
      setCurrentInput(answers[prevField.id] || '');
    }
  };

  // Rule 1 & 7: When selecting template, fields start empty without prefilling fake data
  const handleSelectTemplate = (tpl: FormTemplate) => {
    setSelectedTemplate(tpl);
    setCurrentStepIndex(0);
    setAnswers({});
    setCurrentInput('');
    updateUserData('form', { selectedTemplateId: tpl.id, answers: {} });
  };

  const generatePreviewText = () => {
    return `
APPLICATION / REPRESENTATION
Category: ${selectedTemplate.category}
Subject: Application regarding ${answers.purpose || answers.grievanceSubject || answers.settlementDemand || selectedTemplate.title}

Respected Sir / Madam,

I, ${answers.applicantName || '[Applicant Name]'}, residing at ${answers.residentialAddress || '[Address]'}, beg to state the following facts for your kind consideration:

1. Particulars & Declarations:
${selectedTemplate.fields.map((f, i) => `   (${String.fromCharCode(97 + i)}) ${f.label}: ${answers[f.id] || 'Not specified'}`).join('\n')}

2. Prayer / Relief Sought:
I respectfully request that the competent authority kindly process this representation and issue the necessary orders / certificates at the earliest.

I hereby affirm that the facts stated above are true and correct to the best of my knowledge and belief.

Place: Local District
Date: ${new Date().toLocaleDateString('en-IN')}

Yours faithfully,

_______________________
(${answers.applicantName || 'Citizen Applicant'})
Contact: ${answers.mobileNumber || 'Aadhaar Registered Mobile'}
    `.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePreviewText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    generateGenericDocumentPdf(selectedTemplate.title, generatePreviewText(), answers.applicantName || 'Citizen');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center font-bold text-2xl border border-purple-500/20">
              <FormInput className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                  {t('formTool', language)}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Step-by-Step Guided Assistant
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Answer questions one by one in simple language. Watch your compliant application form build in real-time.
              </p>
            </div>
          </div>

          {/* Rule 8: Show Form Example Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-show-form-example"
              onClick={() => setShowExampleModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Show Form Example</span>
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-2">
            Select Form Template:
          </span>
          {PRESET_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedTemplate.id === tpl.id
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tpl.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Conversational Question Step */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            
            {/* Step Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-100 pb-3">
              <span>Field {currentStepIndex + 1} of {selectedTemplate.fields.length}</span>
              <span className="text-purple-700 font-bold">{selectedTemplate.category}</span>
            </div>

            {currentField && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif mb-1">
                    {language === 'hi' && currentField.labelHi ? currentField.labelHi : currentField.label}
                    {currentField.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-700">Guidance: </strong>
                    {currentField.explanation}
                  </p>
                </div>

                {/* Input Field Rendering */}
                <div>
                  {currentField.type === 'textarea' ? (
                    <textarea
                      rows={4}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder={`Enter ${currentField.label.toLowerCase()}...`}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  ) : currentField.type === 'select' && currentField.options ? (
                    <select
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="">Select option...</option>
                      {currentField.options.map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={currentField.type === 'number' ? 'number' : 'text'}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder={`Enter ${currentField.label.toLowerCase()}...`}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Step Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handlePrevStep}
                    disabled={currentStepIndex === 0}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                  >
                    Previous
                  </button>

                  <button
                    onClick={() => handleNextStep()}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <span>{currentStepIndex === selectedTemplate.fields.length - 1 ? 'Finish & Review' : 'Next Step'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Quick Field Summary List */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Entered Form Fields:
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {selectedTemplate.fields.map((f, i) => (
                <div key={f.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">{f.label}:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                    {answers[f.id] || <em className="text-slate-400 font-normal">Empty</em>}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Live Form Document Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Live Document Preview
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-line min-h-[350px]">
              {generatePreviewText()}
            </div>

          </div>
        </div>

      </div>

      {/* Instructional Example Modal */}
      <ExampleModal
        isOpen={showExampleModal}
        onClose={() => setShowExampleModal(false)}
        tool="form"
        language={language}
        onUseExample={handleUseExample}
      />
    </div>
  );
};
