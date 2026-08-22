import { VERIFIED_SCHEMES_DATABASE } from '../data/groundedSchemes';
import { getGenAI, getGeminiModel, withRetry, safeParseJson } from '../geminiClient';
import { SchemeItem, SchemeMatchResult, SchemeEvaluationResponse, ConfidenceLevel } from '../../src/types';
import { getTargetLanguageInstruction, normalizeLanguageCode } from '../utils/languageHelper';
import { Type } from '@google/genai';

export interface CitizenProfileInput {
  age?: number | string;
  gender?: string;
  stateOrUt?: string;
  district?: string;
  annualIncome?: number | string;
  occupation?: string;
  education?: string;
  category?: string;
  isDisability?: boolean | string;
  isFarmer?: boolean | string;
  locationType?: 'All' | 'Rural' | 'Urban' | string;
  maritalStatus?: string;
  isMinority?: boolean | string;
  housingStatus?: string;
  isMsme?: boolean | string;
  isStudent?: boolean;
}

/**
 * Deterministic Scheme Eligibility Evaluation Engine
 * Evaluates verified government schemes against structured citizen profile parameters.
 */
export async function evaluateSchemeEligibility(
  citizenProfile: CitizenProfileInput,
  query: string = '',
  rawLanguage: string = 'en'
): Promise<SchemeEvaluationResponse> {
  const language = normalizeLanguageCode(rawLanguage);
  const {
    age,
    gender,
    stateOrUt,
    district,
    annualIncome,
    occupation,
    education,
    category,
    isDisability,
    isFarmer,
    locationType,
    maritalStatus,
    isMinority,
    housingStatus,
    isMsme,
    isStudent
  } = citizenProfile || {};

  // 1. First Pass: Deterministic 11-Step Eligibility Evaluation Rule Engine
  const initialEvaluations: SchemeMatchResult[] = VERIFIED_SCHEMES_DATABASE.map(scheme => {
    const reasons: string[] = [];
    const potentialBlockers: string[] = [];
    let score = 0;
    let isMandatoryFail = false;

    // STEP 1 & 2: State / UT Restrictions
    const schemeState = scheme.stateOrUT || scheme.stateOrUt || 'All';
    if (scheme.governmentLevel === 'State' && schemeState !== 'All') {
      if (stateOrUt && stateOrUt.trim() !== '') {
        const normUserState = stateOrUt.trim().toLowerCase();
        const normSchemeState = schemeState.trim().toLowerCase();
        if (normUserState !== normSchemeState && !normSchemeState.includes(normUserState) && !normUserState.includes(normSchemeState)) {
          isMandatoryFail = true;
          potentialBlockers.push(`State Incompatibility: Scheme is exclusive to residents of ${schemeState}. You selected ${stateOrUt}.`);
        } else {
          reasons.push(`State Residency Compatible: Domicile of ${schemeState} matches state eligibility requirement.`);
          score += 10;
        }
      } else {
        potentialBlockers.push(`State Verification Required: Scheme is restricted to ${schemeState}. Please confirm your State/UT.`);
      }
    }

    // STEP 3: Age Restrictions
    const minAge = scheme.ageCriteria?.min ?? scheme.eligibilityCriteria?.ageMin;
    const maxAge = scheme.ageCriteria?.max ?? scheme.eligibilityCriteria?.ageMax;
    if (age !== undefined && age !== null && age !== '') {
      const numAge = Number(age);
      if (!isNaN(numAge)) {
        if (minAge !== undefined && minAge !== null && numAge < minAge) {
          isMandatoryFail = true;
          potentialBlockers.push(`Age Restriction Failed: Applicant age (${numAge} yrs) is below minimum age requirement of ${minAge} years.`);
        } else if (maxAge !== undefined && maxAge !== null && numAge > maxAge) {
          isMandatoryFail = true;
          potentialBlockers.push(`Age Restriction Failed: Applicant age (${numAge} yrs) exceeds maximum age limit of ${maxAge} years.`);
        } else if (minAge !== undefined || maxAge !== undefined) {
          reasons.push(`Age Compatible: Applicant age (${numAge} yrs) satisfies scheme criteria (${minAge || 0}-${maxAge || 'No cap'} yrs).`);
          score += 5;
        }
      }
    }

    // STEP 4: Income Restrictions
    const maxIncome = scheme.incomeCriteria?.maxAnnualIncome ?? scheme.eligibilityCriteria?.maxAnnualIncome;
    if (annualIncome !== undefined && annualIncome !== null && annualIncome !== '') {
      const numIncome = Number(annualIncome);
      if (!isNaN(numIncome) && maxIncome !== undefined && maxIncome !== null) {
        if (numIncome > maxIncome) {
          isMandatoryFail = true;
          potentialBlockers.push(`Income Ceiling Exceeded: Annual family income (₹${numIncome.toLocaleString('en-IN')}) exceeds ceiling limit of ₹${maxIncome.toLocaleString('en-IN')}.`);
        } else {
          reasons.push(`Income Compatible: Family income (₹${numIncome.toLocaleString('en-IN')}) is within annual ceiling of ₹${maxIncome.toLocaleString('en-IN')}. Requires valid Income Certificate.`);
          score += 6;
        }
      }
    }

    // STEP 5: Gender Restrictions
    const targetGender = scheme.genderCriteria || 'All';
    if (targetGender !== 'All' && gender && gender !== 'All') {
      if (gender.trim().toLowerCase() !== targetGender.trim().toLowerCase()) {
        isMandatoryFail = true;
        potentialBlockers.push(`Gender Restriction Failed: Scheme is strictly reserved for ${targetGender} applicants. You selected ${gender}.`);
      } else {
        reasons.push(`Gender Match: Profile matches targeted ${targetGender} beneficiary criteria.`);
        score += 6;
      }
    }

    // STEP 6: Social Category (Caste) Restrictions
    const targetCategories = scheme.casteCategory || scheme.eligibilityCriteria?.socialCategories || ['All'];
    if (!targetCategories.includes('All') && category && category.trim() !== '') {
      const normCat = category.trim().toLowerCase();
      const normTargets = targetCategories.map(c => c.toLowerCase());
      if (!normTargets.includes(normCat) && !normTargets.some(t => normCat.includes(t))) {
        isMandatoryFail = true;
        potentialBlockers.push(`Social Category Mismatch: Scheme is targeted for ${targetCategories.join('/')} categories. You selected ${category}.`);
      } else {
        reasons.push(`Social Category Match: Applicant category (${category}) matches scheme target.`);
        score += 6;
      }
    }

    // STEP 7: Occupation & Special Beneficiary Checks
    const targetOccs = (scheme.occupationCriteria || scheme.eligibilityCriteria?.occupations || ['All']).map(o => o.toLowerCase());
    const occStr = (occupation || '').toLowerCase();
    const edStr = (education || '').toLowerCase();

    const matchesStudent = isStudent || occStr.includes('student') || edStr.includes('student');
    const matchesFarmer = isFarmer === true || isFarmer === 'true' || occStr.includes('farmer') || occStr.includes('agriculture') || occStr.includes('cultivator') || occStr.includes('kisan');
    const matchesMsme = isMsme === true || isMsme === 'true' || occStr.includes('msme') || occStr.includes('business') || occStr.includes('self-employed') || occStr.includes('artisan');
    const matchesVendor = occStr.includes('street vendor') || occStr.includes('hawker') || occStr.includes('vendor');

    if (matchesStudent && (scheme.category === 'Education' || scheme.category === 'Scholarships' || targetOccs.includes('student'))) {
      reasons.push('Student Profile Match: Student status directly aligns with educational scheme criteria.');
      score += 10;
    }

    if (matchesFarmer && (scheme.category === 'Agriculture' || scheme.category === 'Farmers' || scheme.id.includes('kisan') || targetOccs.includes('farmer'))) {
      reasons.push('Farmer Profile Match: Cultivable landholder/farmer profile aligns with agricultural benefit criteria.');
      score += 10;
    }

    if (matchesMsme && (scheme.category === 'Business & MSME' || scheme.category === 'Entrepreneurship' || targetOccs.some(o => ['msme', 'self-employed', 'small business', 'entrepreneur', 'artisan'].includes(o)))) {
      reasons.push('Business / MSME Profile Match: Micro-enterprise or self-employed status matches scheme credit criteria.');
      score += 10;
    }

    if (matchesVendor && (scheme.id === 'pm-svanidhi' || targetOccs.includes('street vendor') || targetOccs.includes('hawker'))) {
      reasons.push('Street Vendor Profile Match: Urban/peri-urban hawker profile matches working capital loan criteria.');
      score += 12;
    }

    // STEP 8: Disability Status Check
    if (scheme.category === 'Disability' || scheme.id.includes('disability') || scheme.id.includes('adip') || scheme.id.includes('udid')) {
      if (isDisability === false || isDisability === 'false') {
        isMandatoryFail = true;
        potentialBlockers.push('Disability Condition Failed: Scheme requires applicant to be a Person with Benchmark Disability (PwD).');
      } else if (isDisability === true || isDisability === 'true') {
        reasons.push('Disability Status Match: PwD status matches scheme target. Requires valid UDID / Disability Certificate (min 40%/80%).');
        score += 12;
      }
    }

    // STEP 9: Location Check (Rural / Urban)
    const targetLoc = scheme.locationCriteria || scheme.eligibilityCriteria?.location || 'All';
    if (targetLoc !== 'All' && locationType && locationType !== 'All') {
      if (targetLoc.toLowerCase() !== locationType.toLowerCase()) {
        isMandatoryFail = true;
        potentialBlockers.push(`Location Mismatch: Scheme is exclusive to ${targetLoc} residents. You selected ${locationType}.`);
      } else {
        reasons.push(`Location Match: ${targetLoc} residency matches scheme requirement.`);
        score += 5;
      }
    }

    // Baseline Match
    if (reasons.length === 0 && !isMandatoryFail) {
      reasons.push('General Baseline Match: Universal citizen welfare scheme with baseline eligibility criteria.');
      score += 2;
    }

    // STEP 10 & 11: Status & Ranking Classification
    let matchStatus: 'Eligible' | 'Appears to Meet Criteria' | 'Potentially Eligible' | 'Needs Verification' | 'Not Eligible';
    let matchConfidence: ConfidenceLevel = 'HIGH';

    if (isMandatoryFail) {
      matchStatus = 'Not Eligible';
      matchConfidence = 'HIGH';
    } else if (score >= 8 && potentialBlockers.length === 0) {
      matchStatus = 'Appears to Meet Criteria';
      matchConfidence = 'HIGH';
    } else {
      matchStatus = 'Needs Verification';
      matchConfidence = 'MEDIUM';
    }

    const officialUrl = scheme.officialSourceUrl || scheme.officialPortalUrl || scheme.applicationUrl || 'https://www.myscheme.gov.in/';

    return {
      scheme,
      matchStatus,
      matchConfidence,
      reasonsForMatch: reasons,
      potentialBlockersOrVerifications: potentialBlockers,
      nextStepsToApply: [
        'Verify your Aadhaar linkage with active bank account (DBT enabled)',
        'Ensure income/caste certificate is up-to-date for current financial year',
        `Access official scheme portal: ${officialUrl}`
      ]
    };
  });

  // Sort: Eligible / Appears to Meet Criteria -> Needs Verification -> Not Eligible
  initialEvaluations.sort((a, b) => {
    const statusWeight: Record<string, number> = {
      'Appears to Meet Criteria': 4,
      'Eligible': 4,
      'Potentially Eligible': 3,
      'Needs Verification': 2,
      'Not Eligible': 0
    };
    return (statusWeight[b.matchStatus] * 100) - (statusWeight[a.matchStatus] * 100);
  });

  // Formulate missing parameters prompt
  const missingParams = [
    !stateOrUt ? 'State/UT of Residence' : null,
    !age ? 'Age (Years)' : null,
    !annualIncome ? 'Annual Family Income' : null,
    !occupation ? 'Occupation' : null,
    !category ? 'Social Category' : null
  ].filter(Boolean) as string[];

  const eligibleCount = initialEvaluations.filter(e => e.matchStatus === 'Appears to Meet Criteria' || e.matchStatus === 'Eligible').length;
  const verificationCount = initialEvaluations.filter(e => e.matchStatus === 'Needs Verification' || e.matchStatus === 'Potentially Eligible').length;
  const excludedCount = initialEvaluations.filter(e => e.matchStatus === 'Not Eligible').length;

  let userSummary = `Evaluated ${initialEvaluations.length} verified government welfare schemes against your profile. Found ${eligibleCount} high-match schemes, ${verificationCount} schemes requiring document verification, and excluded ${excludedCount} non-matching schemes.`;

  // Multilingual localization with Gemini when language !== 'en'
  if (language && language !== 'en') {
    try {
      const langInstruction = getTargetLanguageInstruction(language);
      const ai = getGenAI();
      const model = getGeminiModel();

      const topSchemes = initialEvaluations.slice(0, 6).map(e => ({
        id: e.scheme.id,
        name: e.scheme.name,
        matchStatus: e.matchStatus,
        benefitsSummary: e.scheme.benefits || e.scheme.benefitsSummary,
        reasons: e.reasonsForMatch,
        blockers: e.potentialBlockersOrVerifications
      }));

      const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model,
          contents: `Translate and localize the scheme evaluation summary, missing clarification questions, and top scheme justifications into the target language.
Original Summary: "${userSummary}"
Missing Parameters: ${JSON.stringify(missingParams)}
Top Schemes to localize: ${JSON.stringify(topSchemes)}`,
          config: {
            systemInstruction: `You are the Multilingual Welfare Scheme Advisor of CivicAI.
${langInstruction}
Translate the userSummary, provide targeted clarification questions, and translate the reasons, blockers, and benefit summaries for the top schemes into the TARGET LANGUAGE.
Do not change eligibility numbers, official URLs, or statutory scheme IDs.
Output structured JSON.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                userSummary: { type: Type.STRING },
                missingParametersForRefinement: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['userSummary', 'missingParametersForRefinement']
            }
          }
        });
      });

      const parsed = safeParseJson<any>(response.text, null);
      if (parsed && parsed.userSummary) {
        userSummary = parsed.userSummary;
      }
    } catch (e) {
      console.warn('[Scheme Eligibility AI Translation Fallback]:', e);
    }
  }

  return {
    evaluatedSchemes: initialEvaluations,
    unmatchedOrExcludedCount: excludedCount,
    userSummary,
    missingParametersForRefinement: missingParams
  };
}
