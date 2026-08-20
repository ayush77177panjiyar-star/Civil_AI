import { VERIFIED_SCHEMES_DATABASE } from '../data/groundedSchemes';
import { getGenAI, getGeminiModel, withRetry, safeParseJson } from '../geminiClient';
import { SchemeItem, SchemeMatchResult, SchemeEvaluationResponse, ConfidenceLevel } from '../../src/types';
import { getTargetLanguageInstruction, normalizeLanguageCode } from '../utils/languageHelper';
import { Type } from '@google/genai';

export interface CitizenProfileInput {
  age?: number | string;
  stateOrUt?: string;
  annualIncome?: number | string;
  occupation?: string;
  category?: string;
  gender?: string;
  education?: string;
  isStudent?: boolean;
}

export async function evaluateSchemeEligibility(citizenProfile: CitizenProfileInput, query: string = '', rawLanguage: string = 'en'): Promise<SchemeEvaluationResponse> {
  const language = normalizeLanguageCode(rawLanguage);
  const { age, stateOrUt, annualIncome, occupation, category, gender, education, isStudent } = citizenProfile || {};

  // 1. First Pass: Deterministic Retrieval & Scoring
  const initialEvaluations: SchemeMatchResult[] = VERIFIED_SCHEMES_DATABASE.map(scheme => {
    const reasons: string[] = [];
    const potentialBlockers: string[] = [];
    let score = 0;

    // Age verification
    if (age !== undefined && age !== null && age !== '') {
      const numAge = Number(age);
      if (!isNaN(numAge)) {
        if (scheme.eligibilityCriteria.ageMin && numAge < scheme.eligibilityCriteria.ageMin) {
          potentialBlockers.push(`Age (${numAge} yrs) is below the minimum required age of ${scheme.eligibilityCriteria.ageMin} years.`);
          score -= 6;
        } else if (scheme.eligibilityCriteria.ageMax && numAge > scheme.eligibilityCriteria.ageMax) {
          potentialBlockers.push(`Age (${numAge} yrs) exceeds the maximum age threshold of ${scheme.eligibilityCriteria.ageMax} years.`);
          score -= 6;
        } else {
          reasons.push(`Applicant age (${numAge} yrs) complies with the scheme criteria.`);
          score += 3;
        }
      }
    }

    // Income verification
    if (annualIncome !== undefined && annualIncome !== null && annualIncome !== '') {
      const numIncome = Number(annualIncome);
      if (!isNaN(numIncome)) {
        if (scheme.eligibilityCriteria.maxAnnualIncome && numIncome > scheme.eligibilityCriteria.maxAnnualIncome) {
          potentialBlockers.push(`Annual income (₹${numIncome.toLocaleString('en-IN')}) exceeds the ceiling limit of ₹${scheme.eligibilityCriteria.maxAnnualIncome.toLocaleString('en-IN')}.`);
          score -= 10;
        } else if (scheme.eligibilityCriteria.maxAnnualIncome) {
          reasons.push(`Annual family income is within the ₹${scheme.eligibilityCriteria.maxAnnualIncome.toLocaleString('en-IN')} eligibility threshold.`);
          score += 4;
        }
      }
    }

    // Occupation / Student / Beneficiary check
    const occStr = (occupation || '').toLowerCase();
    const targetOccs = (scheme.eligibilityCriteria.occupations || []).map(o => o.toLowerCase());

    if (isStudent || occStr.includes('student') || (education && education.toLowerCase().includes('student'))) {
      if (scheme.category === 'Education' || targetOccs.includes('students')) {
        reasons.push('Directly matches student / higher education applicant profile.');
        score += 8;
      }
    }

    if (occStr.includes('street vendor') || occStr.includes('hawker') || occStr.includes('vendor')) {
      if (scheme.id === 'pm-svanidhi') {
        reasons.push('Directly matches micro-credit working capital criteria for urban/peri-urban vendors.');
        score += 10;
      }
    }

    if (occStr.includes('farmer') || occStr.includes('agriculture') || occStr.includes('kisan')) {
      if (scheme.category === 'Agriculture' || scheme.id === 'pm-kisan') {
        reasons.push('Directly matches cultivable landholder / farmer income support criteria.');
        score += 10;
      }
    }

    if (occStr.includes('artisan') || occStr.includes('carpenter') || occStr.includes('potter') || occStr.includes('craft')) {
      if (scheme.id === 'pm-vishwakarma') {
        reasons.push('Matches recognized traditional trade / craftsman categorization.');
        score += 10;
      }
    }

    // Gender check
    const genStr = (gender || '').toLowerCase();
    if (scheme.eligibilityCriteria.genders && !scheme.eligibilityCriteria.genders.includes('All')) {
      const allowed = scheme.eligibilityCriteria.genders.map(g => g.toLowerCase());
      if (genStr && genStr !== 'all' && !allowed.includes(genStr as any)) {
        potentialBlockers.push(`Scheme is specifically reserved for ${scheme.eligibilityCriteria.genders.join(', ')} applicants.`);
        score -= 15;
      } else if (genStr.includes('female') || genStr.includes('woman')) {
        reasons.push('Directly matches targeted women empowerment criteria.');
        score += 8;
      }
    }

    // State / UT Check
    if (stateOrUt && scheme.governmentLevel === 'State') {
      if (scheme.stateOrUt && !scheme.stateOrUt.toLowerCase().includes(stateOrUt.toLowerCase())) {
        potentialBlockers.push(`Scheme is exclusive to residents of ${scheme.stateOrUt}.`);
        score -= 12;
      } else if (scheme.stateOrUt) {
        reasons.push(`Resident of eligible state: ${stateOrUt}.`);
        score += 5;
      }
    }

    if (reasons.length === 0 && potentialBlockers.length === 0) {
      reasons.push('General citizen welfare scheme with universal or baseline eligibility.');
      score += 1;
    }

    // Determine status
    let matchStatus: 'Appears to Meet Criteria' | 'Potentially Eligible' | 'Needs Verification' = 'Potentially Eligible';
    let matchConfidence: ConfidenceLevel = 'MEDIUM';

    if (score >= 5 && potentialBlockers.length === 0) {
      matchStatus = 'Appears to Meet Criteria';
      matchConfidence = 'HIGH';
    } else if (score < 0 || potentialBlockers.length > 0) {
      matchStatus = 'Needs Verification';
      matchConfidence = 'LOW';
    }

    return {
      scheme,
      matchStatus,
      matchConfidence,
      reasonsForMatch: reasons,
      potentialBlockersOrVerifications: potentialBlockers,
      nextStepsToApply: [
        'Verify your Aadhaar linkage with active bank account (DBT enabled)',
        'Ensure income certificate is up-to-date for current financial year',
        `Check direct application details at ${scheme.officialPortalUrl}`
      ]
    };
  });

  // Sort by score / status
  initialEvaluations.sort((a, b) => {
    const statusWeight = {
      'Appears to Meet Criteria': 3,
      'Potentially Eligible': 2,
      'Needs Verification': 1
    };
    return (statusWeight[b.matchStatus] * 100) - (statusWeight[a.matchStatus] * 100);
  });

  // Missing info prompt formulation
  const missingParams = [
    !age ? 'Age' : null,
    !annualIncome ? 'Annual Family Income' : null,
    !occupation ? 'Occupation / Student Status' : null,
    !stateOrUt ? 'State/UT of Residence' : null
  ].filter(Boolean) as string[];

  let userSummary = `Evaluated ${initialEvaluations.length} verified government welfare schemes against your profile. Found ${initialEvaluations.filter(e => e.matchStatus === 'Appears to Meet Criteria').length} high-match schemes.`;

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
        benefitsSummary: e.scheme.benefitsSummary,
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
                },
                localizedSchemes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      benefitsSummary: { type: Type.STRING },
                      reasonsForMatch: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      potentialBlockers: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    },
                    required: ['id', 'benefitsSummary', 'reasonsForMatch']
                  }
                }
              },
              required: ['userSummary', 'missingParametersForRefinement']
            }
          }
        });
      });

      const parsed: any = safeParseJson(response.text, {
        userSummary,
        missingParametersForRefinement: []
      });

      if (parsed.userSummary) {
        userSummary = parsed.userSummary;
      }

      // Map back localized justifications
      if (Array.isArray(parsed.localizedSchemes)) {
        parsed.localizedSchemes.forEach((loc: any) => {
          const target = initialEvaluations.find(e => e.scheme.id === loc.id);
          if (target) {
            if (loc.benefitsSummary) target.scheme.benefitsSummary = loc.benefitsSummary;
            if (Array.isArray(loc.reasonsForMatch) && loc.reasonsForMatch.length > 0) target.reasonsForMatch = loc.reasonsForMatch;
            if (Array.isArray(loc.potentialBlockers) && loc.potentialBlockers.length > 0) target.potentialBlockersOrVerifications = loc.potentialBlockers;
          }
        });
      }

      return {
        evaluatedSchemes: initialEvaluations,
        unmatchedOrExcludedCount: 0,
        userSummary,
        missingParametersForRefinement: Array.isArray(parsed.missingParametersForRefinement) && parsed.missingParametersForRefinement.length > 0
          ? parsed.missingParametersForRefinement
          : missingParams
      };
    } catch (err) {
      console.warn('Multilingual scheme localization fallback:', err);
    }
  }

  return {
    evaluatedSchemes: initialEvaluations,
    unmatchedOrExcludedCount: 0,
    userSummary,
    missingParametersForRefinement: missingParams
  };
}
