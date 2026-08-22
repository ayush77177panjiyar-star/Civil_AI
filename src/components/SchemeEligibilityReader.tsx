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
  MapPin,
  XCircle,
  Info,
  Layers,
  GraduationCap,
  Briefcase,
  Heart,
  Home,
  Bot
} from 'lucide-react';
import { Language, SchemeItem, SchemeMatchResult, SchemeEvaluationResponse } from '../types';
import { INDIAN_STATES_AND_UTS } from '../data/indianStates';
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

  // Citizen Profile State
  const [profile, setProfile] = useState({
    age: userData.scheme?.profile?.age || '',
    gender: userData.scheme?.profile?.gender || 'All',
    stateOrUt: userData.scheme?.profile?.stateOrUt || '',
    district: userData.scheme?.profile?.district || '',
    annualIncome: userData.scheme?.profile?.annualIncome || '',
    occupation: userData.scheme?.profile?.occupation || '',
    education: userData.scheme?.profile?.education || '',
    category: userData.scheme?.profile?.category || '',
    isDisability: userData.scheme?.profile?.isDisability || false,
    isFarmer: userData.scheme?.profile?.isFarmer || false,
    locationType: userData.scheme?.profile?.locationType || 'All',
    maritalStatus: userData.scheme?.profile?.maritalStatus || 'Any',
    isMinority: userData.scheme?.profile?.isMinority || false,
    housingStatus: userData.scheme?.profile?.housingStatus || 'Any',
    isMsme: userData.scheme?.profile?.isMsme || false,
    isStudent: userData.scheme?.profile?.isStudent || false
  });

  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGovtLevel, setSelectedGovtLevel] = useState<'All' | 'Central' | 'State'>('All');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'TOP_MATCHES' | 'ALL_SCHEMES' | 'EXCLUDED'>('TOP_MATCHES');
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<SchemeEvaluationResponse | null>(
    userData.scheme?.evaluation || null
  );
  const [selectedSchemeDetail, setSelectedSchemeDetail] = useState<SchemeMatchResult | null>(null);
  const [showExampleModal, setShowExampleModal] = useState(false);

  // Gemini AI Explanation Modal State
  const [aiExplanationModal, setAiExplanationModal] = useState<{
    isOpen: boolean;
    schemeName: string;
    loading: boolean;
    text: string;
  }>({ isOpen: false, schemeName: '', loading: false, text: '' });

  const handleProfileFieldChange = (field: string, val: any) => {
    const next = { ...profile, [field]: val };
    setProfile(next);
    updateUserData('scheme', { profile: next });
  };

  const handleUseExample = (sampleData: any) => {
    const next = {
      age: sampleData.age || '20',
      gender: sampleData.gender || 'All',
      stateOrUt: sampleData.stateOrUt && sampleData.stateOrUt !== 'All States / Pan-India' ? sampleData.stateOrUt : 'Madhya Pradesh',
      district: sampleData.district || 'Bhopal',
      annualIncome: sampleData.annualIncome || '200000',
      occupation: sampleData.occupation || 'Student',
      education: sampleData.education || '12th Pass',
      category: sampleData.category || 'OBC',
      isDisability: false,
      isFarmer: false,
      locationType: 'All',
      maritalStatus: 'Single',
      isMinority: false,
      housingStatus: 'Any',
      isMsme: false,
      isStudent: true
    };
    setProfile(next);
    updateUserData('scheme', { profile: next });
    runEvaluationWithProfile(next);
  };

  const runEvaluationWithProfile = async (profToUse = profile) => {
    setIsEvaluating(true);
    try {
      const data = await CivicApiService.evaluateSchemes(profToUse, searchQuery, language);
      setEvaluation(data);
      updateUserData('scheme', { profile: profToUse, evaluation: data });
      if (data.evaluatedSchemes && data.evaluatedSchemes.length > 0) {
        setSelectedSchemeDetail(data.evaluatedSchemes[0]);
      }

      if (profToUse.occupation || profToUse.age || profToUse.annualIncome || profToUse.stateOrUt) {
        recordActivity(
          'scheme_check',
          `Scheme Check: ${profToUse.occupation || 'Citizen'} (${profToUse.stateOrUt || 'India'})`,
          'schemes',
          '🏛️',
          { profile: profToUse, evaluation: data }
        );
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

  const categories = [
    'All',
    'Agriculture',
    'Scholarships',
    'Education',
    'Women & Child',
    'Healthcare',
    'Housing',
    'Employment',
    'Business & MSME',
    'Pension',
    'Insurance',
    'Skill Development',
    'Disability',
    'Social Security'
  ];

  // Filter schemes locally for search and UI filters
  const allEvaluated = evaluation?.evaluatedSchemes || [];
  
  const filteredSchemes = allEvaluated.filter(item => {
    // 1. Tab Filter
    if (activeTab === 'TOP_MATCHES') {
      if (item.matchStatus === 'Not Eligible') return false;
    } else if (activeTab === 'EXCLUDED') {
      if (item.matchStatus !== 'Not Eligible') return false;
    }

    // 2. Govt Level Filter
    if (selectedGovtLevel !== 'All' && item.scheme.governmentLevel !== selectedGovtLevel) return false;

    // 3. Category Filter
    if (selectedCategory !== 'All') {
      const cat = item.scheme.category.toLowerCase();
      const selCat = selectedCategory.toLowerCase();
      if (!cat.includes(selCat) && !selCat.includes(cat)) return false;
    }

    // 4. State Filter
    if (selectedStateFilter !== 'All') {
      const schemeSt = (item.scheme.stateOrUT || item.scheme.stateOrUt || 'All').toLowerCase();
      if (schemeSt !== 'all' && !schemeSt.includes(selectedStateFilter.toLowerCase())) return false;
    }

    // 5. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = item.scheme.name.toLowerCase();
      const dept = item.scheme.ministryOrDepartment.toLowerCase();
      const ben = (item.scheme.benefits || item.scheme.benefitsSummary || '').toLowerCase();
      const cat = item.scheme.category.toLowerCase();
      const state = (item.scheme.stateOrUT || item.scheme.stateOrUt || '').toLowerCase();
      const target = (item.scheme.targetAudience || []).join(' ').toLowerCase();

      return name.includes(q) || dept.includes(q) || ben.includes(q) || cat.includes(q) || state.includes(q) || target.includes(q);
    }

    return true;
  });

  const eligibleCount = allEvaluated.filter(e => e.matchStatus === 'Appears to Meet Criteria' || e.matchStatus === 'Eligible').length;
  const verificationCount = allEvaluated.filter(e => e.matchStatus === 'Needs Verification' || e.matchStatus === 'Potentially Eligible').length;
  const excludedCount = allEvaluated.filter(e => e.matchStatus === 'Not Eligible').length;

  const handleAskAiExplanation = async (schemeItem: SchemeItem) => {
    setAiExplanationModal({
      isOpen: true,
      schemeName: schemeItem.name,
      loading: true,
      text: ''
    });

    const prompt = `Please explain the government scheme "${schemeItem.name}" in simple, accessible plain language.
Government Level: ${schemeItem.governmentLevel}
Ministry: ${schemeItem.ministryOrDepartment}
Benefits: ${schemeItem.benefits || schemeItem.benefitsSummary}
Eligibility: ${schemeItem.eligibility}
Required Documents: ${(schemeItem.requiredDocuments || []).join(', ')}

Break your explanation into 3 bullet points:
1. What is this scheme and who is it for?
2. What key financial or social benefits will the citizen receive?
3. How to apply step-by-step and what documents are essential?`;

    let accumulated = '';
    await CivicApiService.streamCivicExplanation(
      prompt,
      {
        onChunk: (chunk) => {
          accumulated += chunk;
          setAiExplanationModal(prev => ({ ...prev, text: accumulated }));
        },
        onDone: (full) => {
          setAiExplanationModal(prev => ({ ...prev, loading: false, text: full }));
        },
        onError: (err) => {
          setAiExplanationModal(prev => ({ ...prev, loading: false, text: 'AI explanation temporarily unavailable. Please refer to official scheme details.' }));
        }
      },
      `You are the friendly CivicAI Scheme Explainer. Provide concise, clear, encouraging guidance in ${language === 'hi' ? 'Hindi' : 'English'}.`
    );
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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                {t('schemeTool', language)}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                102+ Official Schemes Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Enter your real parameters to filter verified Central & State government schemes, scholarships, and direct benefit transfers.
            </p>
          </div>
        </div>

        <button
          id="btn-show-eligibility-example"
          onClick={() => setShowExampleModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Show Example Profile</span>
        </button>
      </div>

      {/* Mandatory Incomplete State Prompt Warning */}
      {!profile.stateOrUt && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold text-amber-900">
              Please select your <strong>State/UT</strong> in the profile form below to check state-specific scheme eligibility (e.g. MP Ladli Behna, UP Kanya Sumangala, Raj Chiranjeevi).
            </p>
          </div>
          <button 
            onClick={() => {
              const selectElem = document.getElementById('select-state-or-ut');
              if (selectElem) selectElem.focus();
            }}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
          >
            Select State
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Personal Eligibility Profile Form */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-700" />
                Citizen Eligibility Profile
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">Real-time Matching</span>
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

            {/* Gender */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => handleProfileFieldChange('gender', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="All">All / Any Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>

            {/* State / UT */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                <span>State / Union Territory</span>
                <span className="text-[10px] text-red-600 font-bold">*Required for State Schemes</span>
              </label>
              <select
                id="select-state-or-ut"
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

            {/* Annual Family Income */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Annual Family Income (Rs.)</label>
              <input
                type="number"
                value={profile.annualIncome}
                onChange={(e) => handleProfileFieldChange('annualIncome', e.target.value)}
                placeholder="e.g. 200000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Occupation / Activity</label>
              <select
                value={profile.occupation}
                onChange={(e) => handleProfileFieldChange('occupation', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Occupation...</option>
                <option value="Student">Student (School / College / Higher Ed)</option>
                <option value="Farmer / Agriculture">Farmer / Agriculture Worker</option>
                <option value="Small Business / MSME">Small Business / MSME Vendor</option>
                <option value="Street Vendor / Hawker">Street Vendor / Urban Hawker</option>
                <option value="Unemployed / Job Seeker">Unemployed / Job Seeker</option>
                <option value="Salaried / Employee">Salaried / Private Employee</option>
                <option value="Senior Citizen / Pensioner">Senior Citizen / Pensioner</option>
                <option value="Artisan / Craftsman">Artisan / Traditional Craftsman</option>
                <option value="Labourer / Worker">Daily Wage Worker / Labourer</option>
              </select>
            </div>

            {/* Social Category */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Social Category</label>
              <select
                value={profile.category}
                onChange={(e) => handleProfileFieldChange('category', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Category...</option>
                <option value="General">General</option>
                <option value="OBC">OBC (Other Backward Classes)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
                <option value="Minority">Minority Community</option>
              </select>
            </div>

            {/* Additional Status Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Special Beneficiary Criteria</label>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-disability"
                  checked={!!profile.isDisability}
                  onChange={(e) => handleProfileFieldChange('isDisability', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="chk-disability" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Person with Disability (PwD / UDID Card)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-farmer"
                  checked={!!profile.isFarmer}
                  onChange={(e) => handleProfileFieldChange('isFarmer', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="chk-farmer" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Landholding Farmer / Cultivator
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-msme"
                  checked={!!profile.isMsme}
                  onChange={(e) => handleProfileFieldChange('isMsme', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="chk-msme" className="text-xs font-medium text-slate-700 cursor-pointer">
                  MSME / Micro Business Owner
                </label>
              </div>
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
                  <span>Evaluating 102+ Schemes...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Calculate Scheme Matches</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right Column: Search, Filter, Scheme List & Selected Detail */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by scheme name, keyword (e.g. scholarship, farmer, housing, PM Kisan, Ladli)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Row 1: Govt Level & State Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Government:</span>
                {(['All', 'Central', 'State'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedGovtLevel(level)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedGovtLevel === level
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* State Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">State Filter:</span>
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none"
                >
                  <option value="All">All States / Pan-India</option>
                  {INDIAN_STATES_AND_UTS.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Row 2: Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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

          {/* Results Tab Selector: Top Matches vs All vs Excluded */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('TOP_MATCHES')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'TOP_MATCHES'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Top Schemes For You ({eligibleCount + verificationCount})
              </button>
              <button
                onClick={() => setActiveTab('ALL_SCHEMES')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'ALL_SCHEMES'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Schemes ({allEvaluated.length})
              </button>
              <button
                onClick={() => setActiveTab('EXCLUDED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'EXCLUDED'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Not Eligible ({excludedCount})
              </button>
            </div>

            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              Showing {filteredSchemes.length} schemes
            </span>
          </div>

          {/* Schemes List Grid */}
          {filteredSchemes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No schemes found matching criteria</h3>
              <p className="text-xs text-slate-500">
                Try clearing search filter keywords or switching category filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchemes.map((item) => {
                const isSelected = selectedSchemeDetail?.scheme.id === item.scheme.id;
                const isNotEligible = item.matchStatus === 'Not Eligible';
                const isAppearsMatch = item.matchStatus === 'Appears to Meet Criteria' || item.matchStatus === 'Eligible';

                return (
                  <div
                    key={item.scheme.id}
                    onClick={() => setSelectedSchemeDetail(item)}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Header badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 uppercase tracking-wider">
                        {item.scheme.governmentLevel} • {item.scheme.stateOrUT || item.scheme.stateOrUt || 'Pan-India'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isNotEligible
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : isAppearsMatch
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-amber-800 bg-amber-50 border-amber-200'
                      }`}>
                        {item.matchStatus}
                      </span>
                    </div>

                    {/* Scheme Name */}
                    <h3 className="text-sm font-bold text-slate-900 font-serif leading-snug mb-1">
                      {item.scheme.name}
                    </h3>

                    {/* Benefits Summary */}
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                      {item.scheme.benefits || item.scheme.benefitsSummary}
                    </p>

                    {/* WHY Match Breakdown Box */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1 mb-3">
                      <span className="font-bold text-slate-700 block uppercase text-[9px]">Match Analysis (WHY):</span>
                      
                      {item.reasonsForMatch.slice(0, 2).map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-emerald-800 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{reason}</span>
                        </div>
                      ))}

                      {item.potentialBlockersOrVerifications.slice(0, 2).map((blocker, idx) => (
                        <div key={idx} className={`flex items-start gap-1.5 font-medium ${isNotEligible ? 'text-rose-800' : 'text-amber-800'}`}>
                          {isNotEligible ? (
                            <XCircle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <span className="line-clamp-1">{blocker}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-normal text-[11px] truncate max-w-[170px]">
                        {item.scheme.ministryOrDepartment}
                      </span>
                      <span className="text-blue-700 font-bold flex items-center gap-0.5 shrink-0">
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Scheme Detail Drawer / Full Inspection Modal */}
          {selectedSchemeDetail && (
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-600 shadow-xl space-y-5 animate-in fade-in duration-200">
              
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900">
                      {selectedSchemeDetail.scheme.governmentLevel} Government Scheme
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                      {selectedSchemeDetail.scheme.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedSchemeDetail.matchStatus === 'Not Eligible'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedSchemeDetail.matchStatus === 'Appears to Meet Criteria' || selectedSchemeDetail.matchStatus === 'Eligible'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedSchemeDetail.matchStatus}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif mt-1">
                    {selectedSchemeDetail.scheme.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authority: {selectedSchemeDetail.scheme.ministryOrDepartment} | State/UT: {selectedSchemeDetail.scheme.stateOrUT || selectedSchemeDetail.scheme.stateOrUt || 'Pan-India'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedSchemeDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* WHY Explanation Breakdown Panel */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Deterministic Eligibility Analysis (WHY):
                </h4>
                
                {selectedSchemeDetail.reasonsForMatch.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-100 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}

                {selectedSchemeDetail.potentialBlockersOrVerifications.map((b, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded-xl border font-medium ${
                    selectedSchemeDetail.matchStatus === 'Not Eligible'
                      ? 'text-rose-800 bg-rose-50 border-rose-100'
                      : 'text-amber-800 bg-amber-50 border-amber-100'
                  }`}>
                    {selectedSchemeDetail.matchStatus === 'Not Eligible' ? (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Official Benefits:</h4>
                <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-sans bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  {selectedSchemeDetail.scheme.benefits || selectedSchemeDetail.scheme.benefitsSummary}
                </p>
              </div>

              {/* Eligibility Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Eligibility Overview:</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {selectedSchemeDetail.scheme.eligibility}
                </p>
              </div>

              {/* Exclusions */}
              {selectedSchemeDetail.scheme.exclusions && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Exclusions:</h4>
                  <p className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                    {selectedSchemeDetail.scheme.exclusions}
                  </p>
                </div>
              )}

              {/* Required Documents */}
              {selectedSchemeDetail.scheme.requiredDocuments && selectedSchemeDetail.scheme.requiredDocuments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Required Documents:</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                    {selectedSchemeDetail.scheme.requiredDocuments.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons: Application & Official Source & Gemini AI Explanation */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => handleAskAiExplanation(selectedSchemeDetail.scheme)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
                >
                  <Bot className="w-4 h-4 text-blue-700" />
                  <span>Explain Scheme in Simple Language (AI)</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Official Source Link */}
                  <a
                    href={selectedSchemeDetail.scheme.officialSourceUrl || selectedSchemeDetail.scheme.officialPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <span>Official Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Apply Button */}
                  {selectedSchemeDetail.scheme.applicationUrl ? (
                    <a
                      href={selectedSchemeDetail.scheme.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                    >
                      <span>Apply Online</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 italic bg-slate-100 px-3 py-2 rounded-xl">
                      Application link not available — visit official scheme source.
                    </span>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* AI Scheme Explanation Modal */}
      {aiExplanationModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    AI Explanation: {aiExplanationModal.schemeName}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Plain-Language Scheme Breakdown
                  </span>
                </div>
              </div>

              <button
                onClick={() => setAiExplanationModal({ isOpen: false, schemeName: '', loading: false, text: '' })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="min-h-[160px] text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3 font-sans max-h-[60vh] overflow-y-auto pr-2">
              {aiExplanationModal.loading && !aiExplanationModal.text ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Gemini AI is crafting a plain-language explanation...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {aiExplanationModal.text}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setAiExplanationModal({ isOpen: false, schemeName: '', loading: false, text: '' })}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

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
