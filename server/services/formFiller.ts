import { Type } from '@google/genai';
import { getGenAI, getGeminiModel, withRetry, safeParseJson } from '../geminiClient';
import { getTargetLanguageInstruction, normalizeLanguageCode, getLanguageName, getNativeLanguageName } from '../utils/languageHelper';

export interface FormStepInput {
  templateId: string;
  templateTitle: string;
  currentAnswers?: Record<string, string>;
  userMessage?: string;
  language?: string;
}

export interface FormGenerateInput {
  templateTitle: string;
  department: string;
  answers: Record<string, string>;
  applicantName?: string;
  language?: string;
}

export async function processFormStep(input: FormStepInput) {
  const { templateId, templateTitle, currentAnswers = {}, userMessage = '', language = 'en' } = input;
  const langCode = normalizeLanguageCode(language);
  const langInstruction = getTargetLanguageInstruction(langCode);
  const langName = getLanguageName(langCode);
  const nativeName = getNativeLanguageName(langCode);

  const systemInstruction = `You are the Conversational Government Form Assistant for CivicAI.
Your Task: Help the citizen complete the official application for: "${templateTitle}".
Rules:
1. Extract any newly provided facts from the user's latest message and map them into the structured form fields (e.g., applicantName, fatherOrHusbandName, dobOrAge, gender, residentialAddress, mobileNumber, email, aadhaarNumber, annualIncome, purpose, specificGrievanceOrDetails, districtAndState).
2. NEVER invent missing personal details.
3. Formulate the single NEXT logical, friendly question to ask the user.
${langInstruction}
Ensure 'nextQuestionToAsk', 'assistantMessage', and 'progressSummary' are formulated completely in ${langName} (${nativeName}).
4. If essential fields are filled (Name, Address/Contact, Purpose/Grievance), set isReadyToPreview = true.
Output JSON matching the schema.`;

  const ai = getGenAI();
  const model = getGeminiModel();

  const response = await withRetry(async () => {
    return await ai.models.generateContent({
      model,
      contents: `SELECTED CITIZEN RESPONSE LANGUAGE: ${langName} (${nativeName}) - Code: ${langCode}
Form Title: ${templateTitle} (ID: ${templateId})
Accumulated Field Values: ${JSON.stringify(currentAnswers)}
Latest Citizen Input: "${userMessage}"

MANDATORY INSTRUCTION: You MUST formulate nextQuestionToAsk, assistantMessage, and progressSummary in ${langName} (${nativeName}) because the user selected ${langName}.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedFields: {
              type: Type.OBJECT,
              properties: {
                applicantName: { type: Type.STRING },
                fatherOrHusbandName: { type: Type.STRING },
                dobOrAge: { type: Type.STRING },
                gender: { type: Type.STRING },
                residentialAddress: { type: Type.STRING },
                mobileNumber: { type: Type.STRING },
                email: { type: Type.STRING },
                aadhaarNumber: { type: Type.STRING },
                annualIncome: { type: Type.STRING },
                purpose: { type: Type.STRING },
                specificGrievanceOrDetails: { type: Type.STRING },
                districtAndState: { type: Type.STRING }
              }
            },
            nextQuestionToAsk: { type: Type.STRING },
            assistantMessage: { type: Type.STRING },
            progressSummary: { type: Type.STRING },
            isReadyToPreview: { type: Type.BOOLEAN }
          },
          required: ['extractedFields', 'nextQuestionToAsk', 'assistantMessage', 'progressSummary', 'isReadyToPreview']
        }
      }
    });
  });

  return safeParseJson(response.text, {
    extractedFields: currentAnswers,
    nextQuestionToAsk: 'Could you please provide your full name and residential district/state to proceed with the application?',
    assistantMessage: 'I am helping you fill out the application details.',
    progressSummary: 'Application in progress',
    isReadyToPreview: false
  });
}

export async function generateFormalApplicationDocument(input: FormGenerateInput) {
  const { templateTitle, department, answers = {}, applicantName = 'Applicant', language = 'en' } = input;
  const langCode = normalizeLanguageCode(language);
  const langInstruction = getTargetLanguageInstruction(langCode);
  const langName = getLanguageName(langCode);
  const nativeName = getNativeLanguageName(langCode);

  const systemInstruction = `You are the Expert Legal Form Drafter for CivicAI.
${langInstruction}
Task: Generate a formal, structured representation/application document based on the completed form fields.
Maintain formal administrative decorum, appropriate salutations ("To, The Competent Authority / Designated Officer..."), numbered paragraphs detailing the citizen's prayer/request, list of attached documents, verification clause, and signature area.
Write the representation in ${langName} (${nativeName}).`;

  const prompt = `SELECTED CITIZEN RESPONSE LANGUAGE: ${langName} (${nativeName}) - Code: ${langCode}
Form Type: "${templateTitle}"
Department: "${department}"
Applicant Name: "${applicantName}"
Structured Data: ${JSON.stringify(answers)}

MANDATORY INSTRUCTION: Generate the complete formal application letter text in ${langName} (${nativeName}).`;

  const ai = getGenAI();
  const model = getGeminiModel();

  const response = await withRetry(async () => {
    return await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'text/plain'
      }
    });
  });

  return {
    documentText: response.text || ''
  };
}

export const generateFormalApplication = generateFormalApplicationDocument;
