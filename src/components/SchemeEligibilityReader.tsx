import { INDIAN_STATES_AND_UTS } from '../data/indianStates';
import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Filter, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Building,
  User,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { Language, SchemeItem, SchemeMatchResult, SchemeEvaluationResponse } from '../types';
import { VERIFIED_SCHEMES_DATABASE } from '../data/groundedSchemes';
import { CivicApiService } from '../services/aiService';
import { t } from '../lib/i18n';
import { useUserData } from '../context/UserContext';
import { ExampleModal } from './ExampleModal';

interface SchemeEligibilityReaderProps {
  language: Language;
  initialQuery?: string;
}

export const SchemeEligibilityReader: React.FC<SchemeEligibilityReaderProps> = ({
  language,
  initialQuery = ''
}) => {
  const { userData, updateUserData, recordActivity } = useUserData();

  // Rule 1 & 7: All profile fields start clean & empty for the real citizen
  const [profile, setProfile] = useState({
    age: userData.scheme.profile.age || '',
    stateOrUt: userData.scheme.profile.stateOrUt || '',
    annualIncome: userData.scheme.profile.annualIncome || '',
    occupation: userData.scheme.profile.occupation || '',
    gender: userData.scheme.profile.gender || 'All',
    category: userData.scheme.profile.category || '',
    isStudent: userData.scheme.profile.isStudent || false
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGovtLevel, setSelectedGovtLevel] = useState<'All' | 'Central' | 'State'>('All');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<SchemeEvaluationResponse | null>(
    userData.scheme.evaluation || null
  );
  const [selectedSchemeDetail, setSelectedSchemeDetail] = useState<SchemeMatchResult | null>(null);
  const [showExampleModal, setShowExampleModal] = useState(false);

  const handleProfileFieldChange = (field: string, val: any) => {
    const next = { ...profile, [field]: val };
    setProfile(next);
    updateUserData('scheme', { profile: next });
  };

  const handleUseExample = (sampleData: any) => {
    const next = {
      age: sampleData.age || '20',
      stateOrUt: sampleData.stateOrUt && sampleData.stateOrUt !== 'All States / Pan-India' ? sampleData.stateOrUt : 'Bihar',
      annualIncome: sampleData.annualIncome || '250000',
      occupation: sampleData.occupation || 'Student',
      gender: sampleData.gender || 'All',
      category: sampleData.category || 'General / EWS / OBC',
      isStudent: !!sampleData.isStudent
    };
    setProfile(next);
    updateUserData('scheme', { profile: next });
    runEvaluationWithProfile(next);
  };

  const runEvaluationWithProfile = async (profToUse = profile) => {
    setIsEvaluating(true);
    try {
      const data = await CivicApiService.evaluateSchemes(profToUse, '', language);
      setEvaluation(data);
      updateUserData('scheme', { profile: profToUse, evaluation: data });
      if (data.evaluatedSchemes && data.evaluatedSchemes.length > 0) {
        setSelectedSchemeDetail(data.evaluatedSchemes[0]);
      }

      if (profToUse.occupation || profToUse.age || profToUse.annualIncome) {
        recordActivity(
          'scheme_check',
          `Scheme Check: ${profToUse.occupation || 'Citizen'} (${profToUse.stateOrUt || 'India'})`,
          'schemes',
          '🏛️',
          { profile: profToUse, evaluation: data }
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Evaluate initial list on mount
  useEffect(() => {
    runEvaluationWithProfile();
  }, [language]);

  const categories = ['All', 'Education', 'Agriculture', 'Housing', 'Healthcare', 'Employment', 'Business & MSME', 'Women & Child'];

  const filteredSchemes = (evaluation?.evaluatedSchemes || []).filter(item => {
    if (selectedCategory !== 'All' && item.scheme.category !== selectedCategory) return false;
    if (selectedGovtLevel !== 'All' && item.scheme.governmentLevel !== selectedGovtLevel) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchName = item.scheme.name.toLowerCase().includes(q);
      const matchDept = item.scheme.ministryOrDepartment.toLowerCase().includes(q);
      const matchBen = item.scheme.benefitsSummary.toLowerCase().includes(q);
      return matchName || matchDept || matchBen;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-2xl shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                {t('schemeTool', language)}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                Direct Benefit Transfer & Welfare Finder
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Enter your real parameters to filter verified Central & State government schemes, scholarships, and subsidies.
            </p>
          </div>
        </div>

        {/* Rule 8: Show Eligibility Example Button */}
        <button
          id="btn-show-eligibility-example"
          onClick={() => setShowExampleModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Show Eligibility Example</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Personal Eligibility Filter Form */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-700" />
                Citizen Eligibility Profile
              </h3>
              <span className="text-[10px] text-slate-400 font-normal">Start Empty</span>
            </div>

            {/* Age */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Age (Years)</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => handleProfileFieldChange('age', e.target.value)}
                placeholder="e.g. 20, 45, 62"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* State / UT */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">State / Union Territory</label>
              <select
                value={profile.stateOrUt}
                onChange={(e) => handleProfileFieldChange('stateOrUt', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select State / Union Territory...</option>
                {INDIAN_STATES_AND_UTS.map(region => (
                  <option key={region.name} value={region.name}>
                    {region.name}{region.type === 'UNION_TERRITORY' ? ' (UT)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Annual Income */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Annual Family Income (Rs.)</label>
              <input
                type="number"
                value={profile.annualIncome}
                onChange={(e) => handleProfileFieldChange('annualIncome', e.target.value)}
                placeholder="e.g. 250000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Occupation / Category</label>
              <select
                value={profile.occupation}
                onChange={(e) => handleProfileFieldChange('occupation', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Occupation...</option>
                <option value="Student">Student</option>
                <option value="Farmer / Agriculture">Farmer / Agriculture Worker</option>
                <option value="Small Business / Micro Enterprise">Small Business / MSME Vendor</option>
                <option value="Unemployed / Job Seeker">Unemployed / Job Seeker</option>
                <option value="Salaried / Private Employee">Salaried / Private Employee</option>
                <option value="Senior Citizen / Pensioner">Senior Citizen / Pensioner</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Social Category</label>
              <select
                value={profile.category}
                onChange={(e) => handleProfileFieldChange('category', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Social Category...</option>
                <option value="General">General</option>
                <option value="OBC">OBC (Other Backward Classes)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
              </select>
            </div>

            <button
              id="scheme-btn-evaluate"
              onClick={() => runEvaluationWithProfile()}
              disabled={isEvaluating}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Schemes...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check My Scheme Matches</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right Column: Matched Schemes List & Selected Detail */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-slate-500">
              {filteredSchemes.length} Schemes Found
            </span>
          </div>

          {/* Schemes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchemes.map((item) => (
              <div
                key={item.scheme.id}
                onClick={() => setSelectedSchemeDetail(item)}
                className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                  selectedSchemeDetail?.scheme.id === item.scheme.id
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 uppercase">
                    {item.scheme.governmentLevel} • {item.scheme.category}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {item.matchStatus}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 font-serif leading-snug mb-1">
                  {item.scheme.name}
                </h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                  {item.scheme.benefitsSummary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 font-normal text-[11px]">
                    {item.scheme.ministryOrDepartment}
                  </span>
                  <span className="text-blue-700 font-bold flex items-center gap-0.5">
                    <span>View Scheme</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Scheme Modal/Detail Drawer */}
          {selectedSchemeDetail && (
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-600 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900">
                    {selectedSchemeDetail.scheme.governmentLevel} Government Scheme
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 font-serif mt-1">
                    {selectedSchemeDetail.scheme.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Authority: {selectedSchemeDetail.scheme.sourceAuthority}
                  </p>
                </div>

                <a
                  href={selectedSchemeDetail.scheme.officialPortalUrl || selectedSchemeDetail.scheme.mySchemeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                >
                  <span>Official Application Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Benefits Summary:</h4>
                <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-sans">
                  {selectedSchemeDetail.scheme.benefitsSummary}
                </p>
              </div>

              {selectedSchemeDetail.scheme.documentsRequired && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Required Documents:</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                    {selectedSchemeDetail.scheme.documentsRequired.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Instructional Example Modal */}
      <ExampleModal
        isOpen={showExampleModal}
        onClose={() => setShowExampleModal(false)}
        tool="scheme"
        language={language}
        onUseExample={handleUseExample}
      />
    </div>
  );
};
