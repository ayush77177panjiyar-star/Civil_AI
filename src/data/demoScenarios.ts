export interface DemoRtiData {
  title: string;
  problemQuery: string;
  stateOrUt: string;
  applicantDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export interface DemoSchemeData {
  title: string;
  profile: {
    age: string;
    stateOrUt: string;
    annualIncome: string;
    occupation: string;
    gender: string;
    category: string;
    isStudent: boolean;
  };
  query: string;
}

export interface DemoRightsData {
  title: string;
  problemQuery: string;
  contextDetails: string;
}

export interface DemoDocumentData {
  title: string;
  type: string;
  text: string;
}

export interface DemoFormData {
  templateId: string;
  title: string;
  answers: Record<string, string>;
}

export interface DemoScenariosPackage {
  rti: DemoRtiData;
  scheme: DemoSchemeData;
  rights: DemoRightsData;
  document: DemoDocumentData;
  form: DemoFormData;
}

export const INITIAL_DEMO_SCENARIOS: DemoScenariosPackage = {
  rti: {
    title: 'Demo 1: RTI (Village Road Funds)',
    problemQuery: 'My village road was sanctioned but construction has not happened. I want to know where the money was spent and inspect the certified vouchers and sanction order.',
    stateOrUt: 'Bihar',
    applicantDetails: {
      name: 'Demo Citizen (Sample)',
      address: 'Village Rampur, Post Sadar, Dist. Patna, Bihar - 800001',
      phone: '9876543210',
      email: 'demo.citizen@example.gov.in'
    }
  },
  scheme: {
    title: 'Demo 2: Government Scheme (College Student)',
    profile: {
      age: '20',
      stateOrUt: 'Bihar',
      annualIncome: '250000',
      occupation: 'Student',
      gender: 'All',
      category: 'OBC / EWS / General',
      isStudent: true
    },
    query: 'I am a 20-year-old college student. My annual family income is ₹2.5 lakh. Which government scholarship schemes can I apply for?'
  },
  rights: {
    title: 'Demo 3: Consumer Grievance (Online Appliance)',
    problemQuery: 'I paid ₹18,500 for an electronic appliance online but the seller has not delivered it and is refusing a refund.',
    contextDetails: 'Order placed 25 days ago. E-commerce support closed ticket without resolution. Invoice and payment transaction ID available.'
  },
  document: {
    title: 'Demo 4: Municipal Show Cause Reassessment Notice',
    type: 'Official Municipal Order',
    text: `MUNICIPAL CORPORATION OF GREATER CITY
REVENUE & PROPERTY TAX ASSESSMENT DEPARTMENT
Notice No: MCGC/REV/PROP/2026/8912
Date: 15 January 2026

SHOW CAUSE & REASSESSMENT NOTICE UNDER SECTION 142(3) OF THE MUNICIPAL ACT

To: Property Owner / Occupier of Premises No. 44/B, Ward 18, Block-C, Civil Lines.

WHEREAS, an on-site physical survey and GIS digital mapping conducted by the Municipal Survey Squad revealed that the aforementioned residential structure has undergone unauthorized non-residential commercial usage on the ground floor (area approx 850 sq.ft) without prior sanction of conversion.

NOW THEREFORE, take notice that:
1. The annual ratable property value is provisionally reassessed to ₹1,42,000 per annum with retrospective penalty of ₹28,400.
2. You are hereby directed to file your written objections, if any, along with certified sanction layout plans and electricity tariff receipts within thirty (30) days from the service of this notice before the Deputy Municipal Commissioner (Revenue).
3. In default of filing objections within the stipulated period, the provisional assessment shall become final, and recovery warrants under Section 156 shall be initiated.

By Order of Municipal Commissioner.`
  },
  form: {
    templateId: 'income-cert',
    title: 'Demo 5: Income Certificate Representation',
    answers: {
      applicantName: 'Demo Applicant (Sample)',
      fatherOrHusbandName: 'Shri Ramesh Kumar',
      residentialAddress: 'Village Rampur, Post Sadar, Dist. Patna - 800001',
      annualIncome: '250000',
      incomeSources: 'Agriculture & Small Grocery Shop',
      purpose: 'Post-Matric Higher Education Scholarship Application'
    }
  }
};
