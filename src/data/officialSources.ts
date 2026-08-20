import { OfficialSourceRef } from '../types';

export const OFFICIAL_PORTALS: OfficialSourceRef[] = [
  {
    name: 'RTI Online (Central Government)',
    departmentOrMinistry: 'Department of Personnel and Training (DoPT), Govt. of India',
    portalUrl: 'https://rtionline.gov.in/',
    isCentral: true,
    description: 'Official portal for filing RTI applications and first appeals for Ministries, Departments, and Public Authorities of the Central Government of India.',
    notes: 'IMPORTANT: Do NOT file State Government RTIs on this portal. State public authorities require respective State RTI portals or offline postal submissions.'
  },
  {
    name: 'Maharashtra RTI Online',
    departmentOrMinistry: 'General Administration Department, Govt. of Maharashtra',
    portalUrl: 'https://rtionline.maharashtra.gov.in/',
    isCentral: false,
    stateOrUt: 'Maharashtra',
    description: 'Portal for filing online RTI requests to Maharashtra state departments and local authorities.'
  },
  {
    name: 'Delhi e-RTI Portal',
    departmentOrMinistry: 'Administrative Reforms Department, Govt. of NCT of Delhi',
    portalUrl: 'https://erti.delhigovt.nic.in/',
    isCentral: false,
    stateOrUt: 'Delhi',
    description: 'Online RTI filing for departments and autonomous bodies under Government of NCT of Delhi.'
  },
  {
    name: 'Karnataka Mahiti Hakku (RTI)',
    departmentOrMinistry: 'Department of Personnel & Administrative Reforms, Govt. of Karnataka',
    portalUrl: 'https://rtionline.karnataka.gov.in/',
    isCentral: false,
    stateOrUt: 'Karnataka',
    description: 'Official portal for submitting RTI applications to Karnataka State public authorities.'
  },
  {
    name: 'Uttar Pradesh RTI Online',
    departmentOrMinistry: 'Administrative Reforms Department, Govt. of Uttar Pradesh',
    portalUrl: 'https://rtionline.up.gov.in/',
    isCentral: false,
    stateOrUt: 'Uttar Pradesh',
    description: 'Online RTI portal for UP Government departments, directorates, and commissions.'
  },
  {
    name: 'National Consumer Helpline (NCH)',
    departmentOrMinistry: 'Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution',
    portalUrl: 'https://consumerhelpline.gov.in/',
    isCentral: true,
    description: 'A pre-litigation grievance redressal mechanism providing guidance and alternate dispute resolution for consumer complaints against sellers and service providers.',
    notes: 'Toll-Free Helpline: 1915 or 1800-11-4000. INGRAM portal for tracking consumer grievances.'
  },
  {
    name: 'e-Daakhil (National Consumer Dispute Redressal)',
    departmentOrMinistry: 'National Consumer Disputes Redressal Commission (NCDRC)',
    portalUrl: 'https://edaakhil.nic.in/',
    isCentral: true,
    description: 'Electronic filing system for filing consumer complaints directly before District, State, and National Consumer Commissions without physical court presence.'
  },
  {
    name: 'myScheme Platform',
    departmentOrMinistry: 'Ministry of Electronics & IT (MeitY) & NeGD, Govt. of India',
    portalUrl: 'https://www.myscheme.gov.in/',
    isCentral: true,
    description: 'National single-window platform to discover government schemes based on citizen eligibility criteria across Central and State Governments.'
  },
  {
    name: 'CPGRAMS (Public Grievance Portal)',
    departmentOrMinistry: 'Department of Administrative Reforms and Public Grievances (DARPG)',
    portalUrl: 'https://pgportal.gov.in/',
    isCentral: true,
    description: 'Centralised Public Grievance Redress and Monitoring System for lodging grievances against Central and State Government departments.'
  },
  {
    name: 'National Government Services Portal',
    departmentOrMinistry: 'National Informatics Centre (NIC), Ministry of Electronics & IT',
    portalUrl: 'https://services.india.gov.in/',
    isCentral: true,
    description: 'One-stop access to over 13,000+ citizen-centric services across all Indian states and Union Territories.'
  },
  {
    name: 'National Scholarship Portal (NSP)',
    departmentOrMinistry: 'Ministry of Electronics & Information Technology',
    portalUrl: 'https://scholarships.gov.in/',
    isCentral: true,
    description: 'Common electronic portal for Central and State government post-matric, pre-matric, and merit-cum-means scholarship schemes.'
  },
  {
    name: 'PM-Kisan Samman Nidhi Portal',
    departmentOrMinistry: 'Ministry of Agriculture and Farmers Welfare',
    portalUrl: 'https://pmkisan.gov.in/',
    isCentral: true,
    description: 'Direct income support portal for eligible landholding farmer families across India.'
  },
  {
    name: 'Ayushman Bharat PM-JAY (NHA)',
    departmentOrMinistry: 'National Health Authority, Ministry of Health and Family Welfare',
    portalUrl: 'https://pmjay.gov.in/',
    isCentral: true,
    description: 'Official portal for health cover up to ₹5 lakh per family per year for secondary and tertiary hospitalisation.'
  },
  {
    name: 'e-Courts Services Portal',
    departmentOrMinistry: 'e-Committee, Supreme Court of India & Department of Justice',
    portalUrl: 'https://services.ecourts.gov.in/',
    isCentral: true,
    description: 'Access case status, cause lists, and court orders for District and High Courts across India.'
  }
];
