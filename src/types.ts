export type Language = 
  | 'en' // English
  | 'hi' // à¤¹à¤¿à¤¨à¥à¤¦à¥€ (Hindi)
  | 'bn' // à¦¬à¦¾à¦‚à¦²à¦¾ (Bengali)
  | 'mr' // à¤®à¤°à¤¾à¤ à¥€ (Marathi)
  | 'gu' // àª—à«àªœàª°àª¾àª¤à«€ (Gujarati)
  | 'ta' // à®¤à®®à®¿à®´à¯ (Tamil)
  | 'te' // à°¤à±†à°²à±à°—à± (Telugu)
  | 'kn' // à²•à²¨à³à²¨à²¡ (Kannada)
  | 'ml' // à´®à´²à´¯à´¾à´³à´‚ (Malayalam)
  | 'pa' // à¨ªà©°à¨œà¨¾à¨¬à©€ (Punjabi)
  | 'or' // à¬“à¬¡à¬¼à¬¿à¬† (Odia)
  | 'as' // à¦…à¦¸à¦®à§€à¦¯à¦¼à¦¾ (Assamese)
  | 'ur' // Ø§Ø±Ø¯Ùˆ (Urdu)
  | 'ne'; // à¤¨à¥‡à¤ªà¤¾à¤²à¥€ (Nepali)

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  script: string;
}

export type CivicCategory =
  | 'rti'
  | 'consumer'
  | 'scheme'
  | 'tenant'
  | 'municipal'
  | 'legal_rights'
  | 'document_interp'
  | 'form_filling'
  | 'grievance'
  | 'other';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OfficialSourceRef {
  name: string;
  departmentOrMinistry: string;
  portalUrl: string;
  isCentral: boolean;
  stateOrUt?: string;
  description: string;
  notes?: string;
}

export type IntentType = 
  | 'INFORMATION'
  | 'ACTION'
  | 'DOCUMENT'
  | 'ELIGIBILITY'
  | 'FORM'
  | 'DOCUMENT_INTERPRETATION'
  | 'GENERAL_CONVERSATION';

export interface FollowUpAction {
  label: string;
  actionType: 'tool' | 'query' | 'link';
  targetTool?: 'rti' | 'rights' | 'scheme' | 'form' | 'document';
  targetQuery?: string;
}

export interface ProblemRoutingResult {
  intent?: IntentType;
  requiresTool?: boolean;
  requiresClarification?: boolean;
  directAnswer?: string;
  clarificationQuestion?: string;
  category: CivicCategory | string;
  categoryLabel: string;
  summary: string;
  recommendedTool: 'rti' | 'rights' | 'scheme' | 'form' | 'document' | 'none';
  confidence: ConfidenceLevel;
  reasoning: string;
  suggestedSteps: string[];
  officialSources: OfficialSourceRef[];
  disclaimer: string;
  followUpActions?: FollowUpAction[];
}

// RTI Drafting Types
export interface RtiQuestion {
  id: string;
  question: string;
  placeholder?: string;
  reason: string;
  suggestedValues?: string[];
  answer?: string;
}

export interface RtiDraftData {
  publicAuthority: string;
  department: string;
  isCentralAuthority: boolean;
  stateOrUt?: string;
  pioDesignation: string;
  pioAddress: string;
  subject: string;
  applicantName: string;
  applicantAddress: string;
  applicantPhone?: string;
  applicantEmail?: string;
  informationPoints: string[];
  periodFrom?: string;
  periodTo?: string;
  supportingContext: string;
  feeDetails: string;
  declaration: string;
  officialRouteNote: string;
  officialPortalUrl: string;
  officialPortalName: string;
}

export interface RtiAnalysisResponse {
  objective: string;
  soughtInformationSummary: string;
  likelyAuthority: string;
  isCentralAuthority: boolean;
  stateOrUt: string;
  clarificationQuestions: RtiQuestion[];
  initialDraftReady: boolean;
  generatedDraft?: RtiDraftData;
  officialPortalInfo: {
    name: string;
    url: string;
    guidance: string;
    stateWarning?: string;
  };
}

// Rights Navigator Types
export interface EvidenceItem {
  name: string;
  importance: 'essential' | 'recommended' | 'optional';
  purpose: string;
  tip?: string;
}

export interface EscalationStep {
  level: number;
  stageName: string;
  authority: string;
  timeframe: string;
  procedure: string;
  officialLink?: string;
}

export interface RightsAnalysisResult {
  problemCategory: string;
  plainLanguageSummary: string;
  verifiedFacts: string[];
  possibleInterpretations: string[];
  relevantActsAndRules: {
    actName: string;
    sectionOrRule?: string;
    simpleExplanation: string;
    officialSource: string;
  }[];
  recommendedNextSteps: string[];
  evidenceChecklist: EvidenceItem[];
  escalationLadder: EscalationStep[];
  responsibleAuthority: {
    name: string;
    jurisdiction: string;
    contactOrPortal: string;
    portalUrl?: string;
  };
  confidence: ConfidenceLevel;
  officialSources: {
    title: string;
    authority: string;
    url: string;
    updatedInfo?: string;
  }[];
  disclaimer: string;
}

// Scheme Eligibility Types
export interface CitizenProfile {
  age?: number | string;
  stateOrUt?: string;
  annualIncome?: number | string;
  occupation?: string;
  category?: string;
  gender?: string;
  education?: string;
  isStudent?: boolean;
}

export interface SchemeItem {
  id: string;
  name: string;
  nameHi?: string;
  ministryOrDepartment: string;
  governmentLevel: 'Central' | 'State' | 'Local';
  stateOrUt?: string;
  category: 'Education' | 'Agriculture' | 'Housing' | 'Healthcare' | 'Social Welfare' | 'Employment' | 'Women & Child' | 'Business & MSME' | string;
  targetAudience: string[];
  benefitsSummary: string;
  financialBenefit?: string;
  inKindBenefit?: string;
  eligibilityCriteria: {
    ageMin?: number;
    ageMax?: number;
    maxAnnualIncome?: number;
    occupations?: string[];
    genders?: ('All' | 'Female' | 'Male' | 'Transgender')[];
    socialCategories?: string[];
    specialConditions?: string[];
    location?: string;
  };
  documentsRequired: string[];
  applicationMode: 'Online' | 'Offline' | 'Both';
  applicationSteps: string[];
  officialPortalUrl: string;
  mySchemeUrl: string;
  sourceAuthority: string;
  lastVerifiedDate: string;
}

export interface SchemeMatchResult {
  scheme: SchemeItem;
  matchStatus: 'Potentially Eligible' | 'Appears to Meet Criteria' | 'Needs Verification';
  matchConfidence: ConfidenceLevel;
  reasonsForMatch: string[];
  potentialBlockersOrVerifications: string[];
  nextStepsToApply: string[];
}

export interface SchemeEvaluationResponse {
  evaluatedSchemes: SchemeMatchResult[];
  unmatchedOrExcludedCount: number;
  userSummary: string;
  missingParametersForRefinement: string[];
}

// Conversational Form Filler Types
export interface FormFieldDefinition {
  id: string;
  label: string;
  labelHi?: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
  placeholder?: string;
  required: boolean;
  explanation: string;
  sampleValue?: string;
}

export interface FormTemplate {
  id: string;
  title: string;
  titleHi: string;
  department: string;
  category: string;
  description: string;
  officialAuthority: string;
  fields: FormFieldDefinition[];
}

export interface FormAnswer {
  fieldId: string;
  value: string;
}

export interface FormSession {
  templateId: string;
  currentStepIndex: number;
  answers: Record<string, string>;
  isComplete: boolean;
  generatedDocumentText?: string;
}

// Document Interpreter Types
export interface DocumentCitation {
  pageOrSection: string;
  quotedText?: string;
  simpleInterpretation: string;
}

export interface DocumentInterpretationResult {
  documentType: string;
  targetAudience: string;
  coreSummary: string;
  plainLanguageMeaning: string;
  requiredActions: string[];
  importantDatesAndDeadlines: {
    event: string;
    date: string;
    consequence?: string;
  }[];
  documentsRequired: string[];
  eligibilityConditions: string[];
  feesAndCosts: string;
  responsibleDepartment: string;
  consequencesAndPenalties: string[];
  citations: DocumentCitation[];
  officialSourceOrVerification: {
    issuingAuthority: string;
    gazetteOrRefNumber?: string;
    verificationLink?: string;
    confidence: ConfidenceLevel;
  };
  ocrQuality: 'clear' | 'partially_clear' | 'low_quality_needs_rescan';
  lowConfidenceWarning?: string;
}

// Admin & Quality Types
export interface QualityLogItem {
  id: string;
  timestamp: string;
  feature: string;
  userQuery: string;
  confidence: ConfidenceLevel;
  sourceVerified: boolean;
  sourcesCited: string[];
  feedback?: 'helpful' | 'incorrect' | 'needs_clarification';
}

export interface AdminStats {
  totalQueries: number;
  activeUsers: number;
  rtiDraftsGenerated: number;
  schemesEvaluated: number;
  formsCompleted: number;
  documentsInterpreted: number;
  averageConfidence: number;
  sourceVerificationRate: number;
  recentLogs: QualityLogItem[];
}

// Explicit Type Separation for Examples vs User Data (Requirement 12)
export interface ExampleData {
  type: 'example';
  id: string;
  tool: 'rti' | 'rights' | 'scheme' | 'form' | 'document' | 'general';
  title: Record<string, string>;
  description: Record<string, string>;
  categoryLabel?: Record<string, string>;
  sampleData: any;
  guidanceNotes?: Record<string, string>;
}

export type UserDataType = 'user';
