export const INDIAN_LANGUAGES: Record<string, { name: string; nativeName: string; script: string }> = {
  en: { name: 'English', nativeName: 'English', script: 'Latin' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  mr: { name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia' },
  as: { name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali-Assamese' },
  ur: { name: 'Urdu', nativeName: 'اردو', script: 'Nastaliq / Arabic' },
  ne: { name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari' },
};

export function normalizeLanguageCode(code?: string): string {
  if (!code) return 'en';
  const clean = code.trim().toLowerCase();
  if (INDIAN_LANGUAGES[clean]) return clean;
  // Handle names like "hindi", "marathi", "bengali", "tamil", "urdu", "nepali"
  for (const [key, val] of Object.entries(INDIAN_LANGUAGES)) {
    if (
      val.name.toLowerCase() === clean || 
      val.nativeName.toLowerCase() === clean ||
      clean.startsWith(val.name.toLowerCase()) ||
      clean.startsWith(key)
    ) {
      return key;
    }
  }
  return 'en';
}

export function getLanguageName(code: string): string {
  const normalized = normalizeLanguageCode(code);
  return INDIAN_LANGUAGES[normalized]?.name || 'English';
}

export function getNativeLanguageName(code: string): string {
  const normalized = normalizeLanguageCode(code);
  return INDIAN_LANGUAGES[normalized]?.nativeName || 'English';
}

/**
 * Generates an authoritative, strict system instruction enforcing that ALL AI output
 * MUST be rendered in the citizen's chosen language.
 */
export function getTargetLanguageInstruction(code: string): string {
  const normalized = normalizeLanguageCode(code);
  const lang = INDIAN_LANGUAGES[normalized] || INDIAN_LANGUAGES['en'];

  if (normalized === 'en') {
    return `MANDATORY LANGUAGE DIRECTIVE:
The user selected ENGLISH.
Generate your entire response (all direct answers, summaries, reasons, suggestions, draft sections, questions, and action items) in plain, clear, accessible English.`;
  }

  return `======================================================================
MANDATORY LANGUAGE RESPONSE DIRECTIVE (STRICT NON-NEGOTIABLE REQUIREMENT):
The user has explicitly selected ${lang.name.toUpperCase()} (${lang.nativeName}).
You MUST generate the COMPLETE response in ${lang.name} (${lang.nativeName}) using authentic ${lang.name} script and natural sentence structure.

CRITICAL RULES:
1. ABSOLUTE LANGUAGE PRIORITY:
   The user's selected language is ${lang.name}. It OVERRIDES the input language completely.
   - If the user wrote the question in English, Hinglish, or mixed words -> RESPOND ENTIRELY IN ${lang.name.toUpperCase()}.
   - If the source law, gazette notice, government scheme, or PDF is in English -> TRANSLATE & EXPLAIN IT 100% IN ${lang.name.toUpperCase()}.
   - If the cited authority or portal is Central/English -> EXPLAIN ITS PURPOSE & PROCEDURE IN ${lang.name.toUpperCase()}.
   - NEVER output an English paragraph or English response when ${lang.name} is selected.

2. EVERY OUTPUT FIELD IN ${lang.name.toUpperCase()}:
   Every single string field in your JSON output (including directAnswer, clarificationQuestion, categoryLabel, summary, reasoning, suggestedSteps, questions, placeholders, reasons, analysis, breakdown, plainLanguageExplanation, citizenActionPlan, draft application content, letter subject, body text, declaration, disclaimers, followUpAction labels) MUST be written in natural, fluent ${lang.name} (${lang.nativeName}).

3. ACCURACY OF NON-TRANSLATABLES:
   Keep accurate and untampered:
   - Official portal URLs (e.g., https://rtionline.gov.in, https://consumerhelpline.gov.in)
   - Email addresses and phone/helpline numbers (e.g., 1915)
   - Statutory section notations if helpful (e.g., Section 6(1) of RTI Act, 2005 or कलम ६(१))
   - Specific reference numbers or order IDs.
   All surrounding text, labels, and explanations MUST be in ${lang.name} (${lang.nativeName}).
======================================================================`;
}
