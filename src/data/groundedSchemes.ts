import { SchemeItem } from '../types';

export const VERIFIED_SCHEMES_DATABASE: SchemeItem[] = [
  {
    id: 'nsp-post-matric-sc-st-obc',
    name: 'Post Matric Scholarship Scheme for Higher Education',
    nameHi: 'उच्च शिक्षा हेतु पोस्ट मैट्रिक छात्रवृत्ति योजना',
    ministryOrDepartment: 'Ministry of Social Justice and Empowerment / Ministry of Tribal Affairs',
    governmentLevel: 'Central',
    category: 'Education',
    targetAudience: ['Students', 'Higher Secondary / College Students', 'SC / ST / OBC / Minorities / EWS'],
    benefitsSummary: 'Full tuition fee reimbursement and monthly maintenance allowance for post-matriculation courses.',
    financialBenefit: 'Up to ₹13,500/year maintenance allowance plus full non-refundable academic fees.',
    eligibilityCriteria: {
      ageMin: 15,
      ageMax: 35,
      maxAnnualIncome: 250000,
      occupations: ['Student', 'Unemployed'],
      genders: ['All', 'Female', 'Male', 'Transgender'],
      socialCategories: ['SC', 'ST', 'OBC', 'EWS', 'Minority', 'General (Income criteria applies)'],
      specialConditions: ['Must be enrolled in recognized post-secondary institution', 'Minimum 50% marks in previous exam']
    },
    documentsRequired: [
      'Aadhaar Card of student and parents',
      'Previous educational mark sheets / passing certificates',
      'Valid Income Certificate issued by Sub-Divisional Magistrate/Tehsildar',
      'Caste Certificate / EWS Certificate (if applicable)',
      'Fee receipt & Bonafide certificate from the current educational institution',
      'Active bank account linked with Aadhaar (DBT enabled)'
    ],
    applicationMode: 'Online',
    applicationSteps: [
      'Register on the National Scholarship Portal (NSP) at scholarships.gov.in using Aadhaar/OTR.',
      'Fill Academic & Personal Details and upload required documents.',
      'Submit application to the Institute verification officer.',
      'Track state and district nodal officer verification on the portal.'
    ],
    officialPortalUrl: 'https://scholarships.gov.in/',
    mySchemeUrl: 'https://www.myscheme.gov.in/schemes/pm-usp-csss',
    sourceAuthority: 'Department of Higher Education & Ministry of Social Justice',
    lastVerifiedDate: '2026-01-15'
  },
  {
    id: 'pm-svanidhi',
    name: 'PM Street Vendor\'s AtmaNirbhar Nidhi (PM SVANidhi)',
    nameHi: 'पीएम स्वनिधि (स्ट्रीट वेंडर्स आत्मनिर्भर निधि)',
    ministryOrDepartment: 'Ministry of Housing and Urban Affairs (MoHUA)',
    governmentLevel: 'Central',
    category: 'Employment',
    targetAudience: ['Street Vendors', 'Urban Hawkers', 'Micro-Entrepreneurs', 'Daily Wage Vendors'],
    benefitsSummary: 'Collateral-free working capital loan of ₹10,000 (1st tranche), ₹20,000 (2nd tranche), and up to ₹50,000 (3rd tranche) with 7% interest subsidy and cashback for digital transactions.',
    financialBenefit: 'Collateral-free micro-credit loans up to ₹50,000 with 7% interest subsidy and ₹1,200 annual digital cashback.',
    eligibilityCriteria: {
      ageMin: 18,
      ageMax: 65,
      maxAnnualIncome: 300000,
      occupations: ['Street Vendor', 'Hawker', 'Self-Employed', 'Small Artisan'],
      genders: ['All', 'Female', 'Male', 'Transgender'],
      location: 'Urban / Peri-Urban areas'
    },
    documentsRequired: [
      'Aadhaar Card / Voter ID Card',
      'Certificate of Vending (CoV) / Identity Card issued by Urban Local Body (ULB)',
      'Letter of Recommendation (LoR) from Town Vending Committee (if ID card not yet issued)',
      'Bank Account Passbook / Statement',
      'Mobile number linked with Aadhaar for UPI digital onboarding'
    ],
    applicationMode: 'Online',
    applicationSteps: [
      'Visit the official PM SVANidhi portal at pmsvanidhi.mohua.gov.in or approach a Common Service Centre (CSC).',
      'Verify mobile number with OTP and provide CoV/LoR number from your local municipality.',
      'Select preferred lending institution / bank.',
      'Sign loan sanction agreement upon verification.'
    ],
    officialPortalUrl: 'https://pmsvanidhi.mohua.gov.in/',
    mySchemeUrl: 'https://www.myscheme.gov.in/schemes/pmsvanidhi',
    sourceAuthority: 'Ministry of Housing and Urban Affairs',
    lastVerifiedDate: '2026-02-01'
  },
  {
    id: 'ayushman-bharat-pmjay',
    name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    nameHi: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना',
    ministryOrDepartment: 'National Health Authority (NHA), Ministry of Health and Family Welfare',
    governmentLevel: 'Central',
    category: 'Healthcare',
    targetAudience: ['Low-Income Families', 'BPL Households', 'Senior Citizens aged 70+', 'Vulnerable Workers'],
    benefitsSummary: 'Cashless health insurance coverage of ₹5 Lakh per family per year for secondary and tertiary hospitalisation across 27,000+ empanelled hospitals.',
    financialBenefit: '₹5,00,000 per family/year cashless hospitalization benefit.',
    eligibilityCriteria: {
      maxAnnualIncome: 250000,
      occupations: ['Informal Worker', 'Daily Wager', 'Farmer', 'Self-Employed', 'Unemployed', 'Retired'],
      genders: ['All', 'Female', 'Male', 'Transgender'],
      specialConditions: ['Identified in SECC 2011 database or NFSA Ration Card list', 'All senior citizens aged 70+ regardless of income (PM-JAY Senior Add-on)']
    },
    documentsRequired: [
      'Aadhaar Card of all family members',
      'Ration Card (NFSA / BPL / Antyodaya Anna Yojana)',
      'Proof of Age for Senior Citizens (Aadhaar / Voter ID)',
      'Active mobile number for Ayushman Golden Card generation'
    ],
    applicationMode: 'Both',
    applicationSteps: [
      'Check eligibility on beneficiary.nha.gov.in or via the Ayushman App.',
      'Visit nearest Empanelled Health Care Provider (EHCP) hospital helpdesk or CSC centre.',
      'Complete e-KYC using biometric / Aadhaar OTP.',
      'Receive instant digital Ayushman Card for cashless admission.'
    ],
    officialPortalUrl: 'https://pmjay.gov.in/',
    mySchemeUrl: 'https://www.myscheme.gov.in/schemes/ab-pmjay',
    sourceAuthority: 'National Health Authority',
    lastVerifiedDate: '2026-02-10'
  },
  {
    id: 'pm-kisan-samman-nidhi',
    name: 'PM-Kisan Samman Nidhi (Income Support for Farmers)',
    nameHi: 'प्रधानमंत्री किसान सम्मान निधि योजना',
    ministryOrDepartment: 'Department of Agriculture & Farmers Welfare, Ministry of Agriculture',
    governmentLevel: 'Central',
    category: 'Agriculture',
    targetAudience: ['Small & Marginal Farmers', 'Landholding Agriculturists'],
    benefitsSummary: 'Direct financial assistance of ₹6,000 per year paid in three equal 4-monthly instalments of ₹2,000 directly into farmer bank accounts.',
    financialBenefit: '₹6,000 per year direct income transfer (3 x ₹2,000 instalments).',
    eligibilityCriteria: {
      occupations: ['Farmer', 'Cultivator', 'Agriculturist'],
      specialConditions: ['Must own cultivable agricultural land in revenue records', 'Institutional landholders, income tax payees, and constitutional post holders are excluded']
    },
    documentsRequired: [
      'Aadhaar Card (Mandatory)',
      'Land Ownership Title / Khatauni / Jamabandi / 7/12 extract revenue documents',
      'Bank Account Passbook with Aadhaar seeding and NPCI mapping',
      'e-KYC completion via facial recognition or OTP'
    ],
    applicationMode: 'Both',
    applicationSteps: [
      'Visit pmkisan.gov.in > "Farmer Corner" > "New Farmer Registration".',
      'Enter Rural/Urban status, Aadhaar, State, District, Sub-district, Block, and Village.',
      'Input land survey number, dag number, and land area.',
      'Submit for Patwari/Revenue Inspector verification.'
    ],
    officialPortalUrl: 'https://pmkisan.gov.in/',
    mySchemeUrl: 'https://www.myscheme.gov.in/schemes/pm-kisan',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare',
    lastVerifiedDate: '2026-01-20'
  },
  {
    id: 'pm-awas-yojana-urban-gramin',
    name: 'Pradhan Mantri Awas Yojana (PMAY-Urban / PMAY-Gramin)',
    nameHi: 'प्रधानमंत्री आवास योजना (शहरी / ग्रामीण)',
    ministryOrDepartment: 'Ministry of Housing and Urban Affairs / Ministry of Rural Development',
    governmentLevel: 'Central',
    category: 'Housing',
    targetAudience: ['Homeless Citizens', 'Kutcha House Dwellers', 'EWS / LIG / MIG Income Groups'],
    benefitsSummary: 'Financial subsidy of ₹1.20 Lakh to ₹1.30 Lakh in rural areas, and interest subsidy up to ₹2.67 Lakh in urban areas for pucca house construction.',
    financialBenefit: 'Up to ₹2.67 Lakh credit linked subsidy or ₹1.30 Lakh direct grant.',
    eligibilityCriteria: {
      maxAnnualIncome: 600000,
      occupations: ['All', 'Laborer', 'Farmer', 'Informal Worker', 'Private Employee', 'Self-Employed'],
      specialConditions: ['Family must not own a pucca house in any part of India', 'Female ownership/co-ownership mandatory in urban EWS/LIG']
    },
    documentsRequired: [
      'Aadhaar Card and Voter ID of applicant & spouse',
      'Income Certificate / Form 16 / Salary slips / Self-Declaration',
      'Land ownership deed or NOC from local Panchayat/Municipality',
      'Photographs of current kutcha/dilapidated house',
      'Aadhaar-linked Bank Account details'
    ],
    applicationMode: 'Both',
    applicationSteps: [
      'For Gramin: Contact Gram Panchayat / Block Development Officer (BDO) to check Awas+ list.',
      'For Urban: Apply online through pmaymis.gov.in under Citizen Assessment or through CSC.',
      'Geo-tagging and site inspection conducted by municipal/panchayat engineer.',
      'Funds released in DBT milestone tranches directly to bank account.'
    ],
    officialPortalUrl: 'https://pmay-urban.gov.in/',
    mySchemeUrl: 'https://www.myscheme.gov.in/schemes/pmayu',
    sourceAuthority: 'Ministry of Housing and Urban Affairs',
    lastVerifiedDate: '2026-01-10'
  },
  {
    id: 'pm-vishwakarma-yojana',
    name: 'PM Vishwakarma Scheme (Support for Traditional Artisans & Craftsmen)',
    nameHi: 'पीएम विश्वकर्मा योजना (पारंपरिक कारीगर व शिल्पकार सहायता)',
    ministryOrDepartment: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
    governmentLevel: 'Central',
    category: 'Business & MSME',
    targetAudience: ['Artisans', 'Craftspeople', 'Carpenters', 'Blacksmiths', 'Goldsmiths', 'Potters', 'Sculptors', 'Cobblers', 'Masons', 'Tailors', 'Barbers'],
    benefitsSummary: 'PM Vishwakarma Certificate & ID, 5-7 days basic skill training with ₹500/day stipend, ₹15,000 modern toolkit incentive, and collateral-free credit up to ₹3,00,000 at 5% concessional interest rate.',
    financialBenefit: '₹15,000 modern toolkit grant + ₹3,00,000 collateral-free loan at 5% interest.',
    eligibilityCriteria: {
      ageMin: 18,
      ageMax: 65,
      occupations: ['Artisan', 'Craftsman', 'Carpenter', 'Blacksmith', 'Mason', 'Tailor', 'Barber', 'Potter', 'Cobbler', 'Weaver', 'Sculptor'],
      specialConditions: ['Engaged in one of 18 eligible traditional trades on self-employment basis', 'Only one member per family eligible', 'Must not have availed similar government credit (e.g. PMEGP) in last 5 years']
    },
    documentsRequired: [
      'Aadhaar Card with mobile linkage',
      'Bank Account details (Passbook / Cancelled Cheque)',
      'Ration Card / Family details proof',
      'Skill trade verification by Gram Panchayat Head or ULB Executive Officer'
    ],
    applicationMode: 'Online',
    applicationSteps: [
      'Visit nearest Common Services Centre (CSC) with trade tools evidence and Aadhaar.',
      'Complete biometric e-KYC and trade registration on pmvishwakarma.gov.in.',
      'Stage 1 Verification: Gram Panchayat / ULB level.',
      'Stage 2 & 3: District Implementation Committee and Screening Committee approval.'
    ],
    officialPortalUrl: 'https://pmvishwakarma.gov.in/',
    mySchemeUrl: 'https://www.myscheme.gov.in/schemes/pm-vishwakarma',
    sourceAuthority: 'Ministry of MSME',
    lastVerifiedDate: '2026-02-05'
  },
  {
    id: 'sukanya-samriddhi-yojana',
    name: 'Sukanya Samriddhi Yojana (Girl Child Financial Security)',
    nameHi: 'सुकन्या समृद्धि योजना (बालिका वित्तीय सुरक्षा)',
    ministryOrDepartment: 'Ministry of Finance / Department of Posts',
    governmentLevel: 'Central',
    category: 'Women & Child',
    targetAudience: ['Parents/Guardians of Girl Child below 10 years of age'],
    benefitsSummary: 'High government-backed sovereign interest rate (currently 8.2% p.a.), compounding annually with full triple tax exemption under Section 80C (EEE status).',
    financialBenefit: 'Guaranteed high-yield savings (8.2% p.a.) with tax-free maturity corpus for girl\'s higher education/marriage.',
    eligibilityCriteria: {
      ageMin: 0,
      ageMax: 10,
      genders: ['Female'],
      specialConditions: ['Account can be opened anytime from birth till girl reaches 10 years', 'Maximum 2 accounts per family (or 3 in case of first-born/twin daughters)']
    },
    documentsRequired: [
      'Birth Certificate of the girl child issued by Municipal authority / Registrar of Births',
      'Identity proof of parent/legal guardian (Aadhaar / PAN / Passport)',
      'Address proof of guardian',
      'Recent passport-size photographs of child and guardian'
    ],
    applicationMode: 'Offline',
    applicationSteps: [
      'Obtain Sukanya Samriddhi Account Opening Form from any Post Office or authorised Commercial Bank branch (SBI, PNB, BoB, etc.).',
      'Fill the form with child and guardian details.',
      'Submit with initial deposit (minimum ₹250, maximum ₹1,50,000 per financial year).',
      'Collect official passbook containing account details.'
    ],
    officialPortalUrl: 'https://www.indiapost.gov.in/',
    mySchemeUrl: 'https://www.myscheme.gov.in/schemes/ssy',
    sourceAuthority: 'Department of Posts & Ministry of Finance',
    lastVerifiedDate: '2026-01-25'
  },
  {
    id: 'pradhan-mantri-matru-vandana-yojana',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    nameHi: 'प्रधानमंत्री मातृ वंदना योजना',
    ministryOrDepartment: 'Ministry of Women and Child Development (MWCD)',
    governmentLevel: 'Central',
    category: 'Women & Child',
    targetAudience: ['Pregnant Women', 'Lactating Mothers'],
    benefitsSummary: 'Direct cash incentive of ₹5,000 for first child in 2 instalments, and ₹6,000 for second child (if girl child) for wage compensation and nutrition support.',
    financialBenefit: 'Direct Cash Transfer of ₹5,000 to ₹6,000 in bank account.',
    eligibilityCriteria: {
      ageMin: 19,
      ageMax: 45,
      genders: ['Female'],
      maxAnnualIncome: 800000,
      specialConditions: ['Applicable for pregnant women and lactating mothers for first and second live child (if girl)', 'Excludes regular employees of Central/State Govt or PSUs']
    },
    documentsRequired: [
      'Aadhaar Card of mother and husband',
      'Mother and Child Protection (MCP) Card registered with Anganwadi / Health Centre',
      'Identity Proof and Proof of Antenatal Check-up (ANC)',
      'Aadhaar-seeded Bank Account Passbook of the mother'
    ],
    applicationMode: 'Both',
    applicationSteps: [
      'Register at the nearest Anganwadi Centre (AWC) or approved health facility, or online at pmmvy.wcd.gov.in.',
      'Submit MCP card details and proof of ANC check-up within 150 days of LMP.',
      'Second instalment disbursed upon child birth registration and initial vaccination cycle.'
    ],
    officialPortalUrl: 'https://pmmvy.wcd.gov.in/',
    mySchemeUrl: 'https://www.myscheme.gov.in/schemes/pmmvy',
    sourceAuthority: 'Ministry of Women & Child Development',
    lastVerifiedDate: '2026-02-01'
  }
];
