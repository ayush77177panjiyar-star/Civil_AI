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
  Sparkles,
  X,
  Calendar,
  DollarSign,
  Info
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
  const { userData, updateUserData } = useUserData();

  // Citizen Profile State
  const [profile, setProfile] = useState({
    age: userData.scheme.profile.age || '',
    stateOrUt: userData.scheme.profile.stateOrUt || '',
    annualIncome: userData.scheme.profile.annualIncome || '',
    occupation: userData.scheme.profile.occupation || '',
    gender: userData.scheme.profile.gender || 'All',
    category: userData.scheme.profile.category || '',
    isStudent: userData.scheme.profile.isStudent || false
  });

  const [searchFilter, setSearchFilter] = useState(initialQuery || '');
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
    } catch (err) {
      console.error('Scheme Evaluation Error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Evaluate initial list on mount
  useEffect(() => {
    runEvaluationWithProfile();
  }, [language]);

  const categories = ['All', 'Education', 'Agriculture', 'Housing', 'Healthcare', 'Employment', 'Business & MSME', 'Women & Child'];

  // Filter schemes dynamically based on category, level, search query, state, etc.
  const filteredSchemes = (evaluation?.evaluatedSchemes || []).filter(item => {
    if (!item || !item.scheme) return false;
    if (selectedCategory !== 'All' && item.scheme.category !== selectedCategory) return false;
    if (selectedGovtLevel !== 'All' && item.scheme.governmentLevel !== selectedGovtLevel) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchName = item.scheme.name ? item.scheme.name.toLowerCase().includes(q) : false;
      const matchDept = item.scheme.ministryOrDepartment ? item.scheme.ministryOrDepartment.toLowerCase().includes(q) : false;
      const matchBen = item.scheme.benefitsSummary ? item.scheme.benefitsSummary.toLowerCase().includes(q) : false;
      return matchName || matchDept || matchBen;
    }
    return true;
  });

  // Keep selectedSchemeDetail synchronized with filtered list so stale state is never rendered
  useEffect(() => {
    if (filteredSchemes.length > 0) {
      const isVisible = selectedSchemeDetail && filteredSchemes.some(item => item.scheme?.id === selectedSchemeDetail.scheme?.id);
      if (!isVisible) {
        setSelectedSchemeDetail(filteredSchemes[0]);
      }
    } else {
      setSelectedSchemeDetail(null);
    }
  }, [searchFilter, selectedCategory, selectedGovtLevel, evaluation]);

  // Robust View Details handler by stable unique scheme ID
  const handleViewDetails = (schemeId: string) => {
    if (!schemeId) {
      setSelectedSchemeDetail(null);
      return;
    }
    const foundInEval = (evaluation?.evaluatedSchemes || []).find(item => item.scheme && item.scheme.id === schemeId);
    if (foundInEval) {
      setSelectedSchemeDetail(foundInEval);
    } else {
      const foundInDb = VERIFIED_SCHEMES_DATABASE.find(s => s.id === schemeId);
      if (foundInDb) {
        setSelectedSchemeDetail({
          scheme: foundInDb,
          matchStatus: 'Potentially Eligible',
          matchConfidence: 'MEDIUM',
          reasonsForMatch: ['Verified government scheme matching selected criteria.'],
          potentialBlockersOrVerifications: [],
          nextStepsToApply: [
            'Verify Aadhaar & bank account linkage (DBT enabled)',
            `Apply directly at ${foundInDb.officialPortalUrl || foundInDb.mySchemeUrl}`
          ]
        });
      } else {
        setSelectedSchemeDetail(null);
      }
    }
  };

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

        {/* Right Column: Matched Schemes List & Selected Detail View */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search by scheme name, department, or benefits..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedGovtLevel}
                  onChange={(e) => setSelectedGovtLevel(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="All">All Govt Levels</option>
                  <option value="Central">Central Govt</option>
                  <option value="State">State Govt</option>
                </select>

                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  {filteredSchemes.length} Schemes
                </span>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
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
          </div>

          {/* Schemes Grid */}
          {filteredSchemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchemes.map((item) => {
                const schemeId = item.scheme?.id;
                const isSelected = selectedSchemeDetail?.scheme?.id === schemeId;
                return (
                  <div
                    key={schemeId || Math.random().toString()}
                    onClick={() => handleViewDetails(schemeId)}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 uppercase">
                          {item.scheme?.governmentLevel || 'Government'} • {item.scheme?.category || 'General'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.matchStatus === 'Appears to Meet Criteria'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : item.matchStatus === 'Potentially Eligible'
                            ? 'text-blue-700 bg-blue-50 border-blue-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}>
                          {item.matchStatus || 'Potentially Eligible'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 font-serif leading-snug mb-1">
                        {item.scheme?.name || 'Information not available'}
                      </h3>
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                        {item.scheme?.benefitsSummary || 'Information not available'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <span className="text-slate-400 font-normal text-[11px] truncate max-w-[140px]">
                        {item.scheme?.ministryOrDepartment || 'Government Authority'}
                      </span>

                      {/* Explicit View Details Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(schemeId);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all shadow-2xs shrink-0"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No schemes found matching your filter.</h4>
              <p className="text-xs text-slate-500">Try clearing your search keyword or switching the category filter.</p>
              <button
                onClick={() => {
                  setSearchFilter('');
                  setSelectedCategory('All');
                  setSelectedGovtLevel('All');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Selected Scheme Details Section / Drawer */}
          {selectedSchemeDetail ? (
            selectedSchemeDetail.scheme ? (
              <div className="bg-white rounded-2xl p-6 border-2 border-blue-600 shadow-xl space-y-6 animate-in fade-in duration-200">
                
                {/* Header & Close Action */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                        {selectedSchemeDetail.scheme.governmentLevel || 'Government'} Scheme
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                        {selectedSchemeDetail.scheme.category || 'General'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedSchemeDetail.matchStatus === 'Appears to Meet Criteria'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}>
                        {selectedSchemeDetail.matchStatus || 'Potentially Eligible'}
                      </span>
                    </div>

                    {/* 1. Scheme Name */}
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                      {selectedSchemeDetail.scheme.name || 'Information not available'}
                    </h2>
                    {selectedSchemeDetail.scheme.nameHi && (
                      <p className="text-xs text-slate-600 font-medium">{selectedSchemeDetail.scheme.nameHi}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedSchemeDetail(null)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Close Details"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Match Justification: Why this scheme matches you */}
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Why This Scheme Matches You:
                  </h4>
                  <ul className="space-y-1 text-xs text-blue-950">
                    {(selectedSchemeDetail.reasonsForMatch || []).map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  {selectedSchemeDetail.potentialBlockersOrVerifications && selectedSchemeDetail.potentialBlockersOrVerifications.length > 0 && (
                    <div className="pt-2 border-t border-blue-200/60 text-xs text-amber-900">
                      <span className="font-bold block mb-1">Verification Required:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {selectedSchemeDetail.potentialBlockersOrVerifications.map((blk, i) => (
                          <li key={i}>{blk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 19 Required Fields Grid Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left Metadata Column */}
                  <div className="space-y-4">
                    {/* 2. Government Level */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">2. Government Level</span>
                      <span className="text-xs font-semibold text-slate-800">{selectedSchemeDetail.scheme.governmentLevel || 'Information not available'}</span>
                    </div>

                    {/* 3. State / UT */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">3. State / Union Territory</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {selectedSchemeDetail.scheme.stateOrUt || (selectedSchemeDetail.scheme.governmentLevel === 'Central' ? 'All India / Pan-India' : 'Information not available')}
                      </span>
                    </div>

                    {/* 4. Ministry / Department */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">4. Ministry / Department</span>
                      <span className="text-xs font-semibold text-slate-800">{selectedSchemeDetail.scheme.ministryOrDepartment || 'Information not available'}</span>
                    </div>

                    {/* 5. Category */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">5. Category</span>
                      <span className="text-xs font-semibold text-slate-800">{selectedSchemeDetail.scheme.category || 'Information not available'}</span>
                    </div>

                    {/* 19. Last Verified Date */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">19. Last Verified Date</span>
                      <span className="text-xs font-semibold text-slate-800">{selectedSchemeDetail.scheme.lastVerifiedDate || 'Information not available'}</span>
                    </div>
                  </div>

                  {/* Right Criteria Breakdown Column */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">
                      Structured Eligibility Criteria
                    </h4>

                    {/* 8. Eligibility Overview */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">8. Target Beneficiaries:</span>
                      <span className="text-xs text-slate-800">
                        {selectedSchemeDetail.scheme.targetAudience && selectedSchemeDetail.scheme.targetAudience.length > 0
                          ? selectedSchemeDetail.scheme.targetAudience.join(', ')
                          : 'Information not available'}
                      </span>
                    </div>

                    {/* 9. Age Criteria */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">9. Age Criteria:</span>
                      <span className="text-xs text-slate-800">
                        {selectedSchemeDetail.scheme.eligibilityCriteria?.ageMin || selectedSchemeDetail.scheme.eligibilityCriteria?.ageMax
                          ? `${selectedSchemeDetail.scheme.eligibilityCriteria?.ageMin ? `Min: ${selectedSchemeDetail.scheme.eligibilityCriteria.ageMin} Years` : ''} ${selectedSchemeDetail.scheme.eligibilityCriteria?.ageMax ? `Max: ${selectedSchemeDetail.scheme.eligibilityCriteria.ageMax} Years` : ''}`
                          : 'Information not available'}
                      </span>
                    </div>

                    {/* 10. Income Criteria */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">10. Income Criteria:</span>
                      <span className="text-xs text-slate-800">
                        {selectedSchemeDetail.scheme.eligibilityCriteria?.maxAnnualIncome
                          ? `Max Ceiling: ₹${selectedSchemeDetail.scheme.eligibilityCriteria.maxAnnualIncome.toLocaleString('en-IN')} / year`
                          : 'Information not available'}
                      </span>
                    </div>

                    {/* 11. Occupation Criteria */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">11. Occupation Criteria:</span>
                      <span className="text-xs text-slate-800">
                        {selectedSchemeDetail.scheme.eligibilityCriteria?.occupations && selectedSchemeDetail.scheme.eligibilityCriteria.occupations.length > 0
                          ? selectedSchemeDetail.scheme.eligibilityCriteria.occupations.join(', ')
                          : 'Information not available'}
                      </span>
                    </div>

                    {/* 12. Gender Criteria */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">12. Gender Criteria:</span>
                      <span className="text-xs text-slate-800">
                        {selectedSchemeDetail.scheme.eligibilityCriteria?.genders && selectedSchemeDetail.scheme.eligibilityCriteria.genders.length > 0
                          ? selectedSchemeDetail.scheme.eligibilityCriteria.genders.join(', ')
                          : 'Information not available'}
                      </span>
                    </div>

                    {/* 13. Category / Caste Criteria */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">13. Category / Caste Criteria:</span>
                      <span className="text-xs text-slate-800">
                        {selectedSchemeDetail.scheme.eligibilityCriteria?.socialCategories && selectedSchemeDetail.scheme.eligibilityCriteria.socialCategories.length > 0
                          ? selectedSchemeDetail.scheme.eligibilityCriteria.socialCategories.join(', ')
                          : 'Information not available'}
                      </span>
                    </div>

                    {/* 14. Education / Special Criteria */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">14. Education & Special Conditions:</span>
                      <span className="text-xs text-slate-800">
                        {selectedSchemeDetail.scheme.eligibilityCriteria?.specialConditions && selectedSchemeDetail.scheme.eligibilityCriteria.specialConditions.length > 0
                          ? selectedSchemeDetail.scheme.eligibilityCriteria.specialConditions.join('; ')
                          : 'Information not available'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* 6. Description & 7. Benefits */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">6. Scheme Description:</h4>
                    <p className="text-xs sm:text-sm text-slate-900 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {selectedSchemeDetail.scheme.benefitsSummary || 'Information not available'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      7. Benefits & Financial Assistance:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                        <span className="font-bold text-emerald-900 block mb-0.5">Financial Benefit:</span>
                        <p className="text-emerald-950">{selectedSchemeDetail.scheme.financialBenefit || selectedSchemeDetail.scheme.benefitsSummary || 'Information not available'}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-0.5">In-Kind Benefit:</span>
                        <p className="text-slate-800">{selectedSchemeDetail.scheme.inKindBenefit || 'Information not available'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 15. Required Documents */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    15. Required Documents to Apply:
                  </h4>
                  {selectedSchemeDetail.scheme.documentsRequired && selectedSchemeDetail.scheme.documentsRequired.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                      {selectedSchemeDetail.scheme.documentsRequired.map((doc, i) => (
                        <li key={i} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200">Information not available</p>
                  )}
                </div>

                {/* 16. Application Process */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                    16. Application Process (Mode: {selectedSchemeDetail.scheme.applicationMode || 'Information not available'}):
                  </h4>
                  {selectedSchemeDetail.scheme.applicationSteps && selectedSchemeDetail.scheme.applicationSteps.length > 0 ? (
                    <ol className="space-y-2 text-xs text-slate-800">
                      {selectedSchemeDetail.scheme.applicationSteps.map((step, idx) => (
                        <li key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200">Information not available</p>
                  )}
                </div>

                {/* 17. Official Application URL & 18. Official Source URL */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <span className="block font-semibold">Source Authority: {selectedSchemeDetail.scheme.sourceAuthority || 'Information not available'}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 18. Official Source URL / myScheme */}
                    {selectedSchemeDetail.scheme.mySchemeUrl ? (
                      <a
                        href={selectedSchemeDetail.scheme.mySchemeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                      >
                        <span>18. View on myScheme</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        Official source URL unavailable
                      </span>
                    )}

                    {/* 17. Official Application URL */}
                    {selectedSchemeDetail.scheme.officialPortalUrl ? (
                      <a
                        href={selectedSchemeDetail.scheme.officialPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                      >
                        <span>17. Apply on Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-300">
                        Official application link unavailable
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Scheme details could not be loaded.</h4>
                <button
                  onClick={() => setSelectedSchemeDetail(null)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Back to Schemes
                </button>
              </div>
            )
          ) : null}

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
