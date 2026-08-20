export interface GlossaryTerm {
  officialTermEn: string;
  officialTermHi: string;
  simpleMeaningEn: string;
  simpleMeaningHi: string;
  context: string;
  officialReference?: string;
}

export const CIVIC_GLOSSARY: GlossaryTerm[] = [
  {
    officialTermEn: 'Public Authority',
    officialTermHi: 'लोक प्राधिकारी (Public Authority)',
    simpleMeaningEn: 'Any government body, department, ministry, municipal corporation, or state-funded institution responsible for providing public services or records.',
    simpleMeaningHi: 'कोई भी सरकारी विभाग, मंत्रालय, नगर निगम या सरकारी सहायता प्राप्त संस्थान जो जनता को सेवा या जानकारी देने के लिए जिम्मेदार है।',
    context: 'RTI Act 2005 & Administrative Law',
    officialReference: 'Section 2(h), RTI Act 2005'
  },
  {
    officialTermEn: 'Public Information Officer (PIO / CPIO / SPIO)',
    officialTermHi: 'लोक सूचना अधिकारी (PIO)',
    simpleMeaningEn: 'The designated government officer in every department whose legal duty is to receive and reply to RTI applications within 30 days.',
    simpleMeaningHi: 'हर सरकारी दफ्तर का वह तय अधिकारी जिसका कानूनी कर्तव्य है कि वह 30 दिनों के भीतर आरटीआई का जवाब दे।',
    context: 'RTI Act 2005',
    officialReference: 'Section 5(1), RTI Act 2005'
  },
  {
    officialTermEn: 'First Appellate Authority (FAA)',
    officialTermHi: 'प्रथम अपीलीय प्राधिकारी (FAA)',
    simpleMeaningEn: 'A senior officer in the same government department to whom you can appeal if the PIO denies your RTI, gives false info, or does not reply in 30 days.',
    simpleMeaningHi: 'उसी विभाग का वरिष्ठ अधिकारी जिसके पास आप तब अपील कर सकते हैं जब पीआईओ 30 दिन में जवाब न दे या गलत जानकारी दे।',
    context: 'RTI Appeals',
    officialReference: 'Section 19(1), RTI Act 2005'
  },
  {
    officialTermEn: 'Deficiency in Service',
    officialTermHi: 'सेवा में कमी (Deficiency in Service)',
    simpleMeaningEn: 'Any fault, imperfection, shortcoming or inadequacy in the quality, nature, and manner of performance required to be maintained by a service provider (like banks, builders, airlines, telecom).',
    simpleMeaningHi: 'किसी सेवा प्रदाता (जैसे बैंक, बिल्डर, अस्पताल) द्वारा किए गए वादे या तय मानकों में कोई भी कमी, खराबी या लापरवाही।',
    context: 'Consumer Protection Act 2019',
    officialReference: 'Section 2(11), Consumer Protection Act 2019'
  },
  {
    officialTermEn: 'Unfair Trade Practice',
    officialTermHi: 'अनुचित व्यापार व्यवहार (Unfair Trade Practice)',
    simpleMeaningEn: 'Deceptive or fraudulent practices used by sellers, such as false discounts, misleading advertisements, refusing refund of defective items, or withholding warranty.',
    simpleMeaningHi: 'दुकानदारों या कंपनियों द्वारा की गई धोखाधड़ी, जैसे झूठे विज्ञापन, नकली छूट या खराब सामान वापस लेने से मना करना।',
    context: 'Consumer Protection Act 2019',
    officialReference: 'Section 2(47), Consumer Protection Act 2019'
  },
  {
    officialTermEn: 'Direct Benefit Transfer (DBT)',
    officialTermHi: 'प्रत्यक्ष लाभ अंतरण (DBT)',
    simpleMeaningEn: 'Transfer of government subsidies, pensions, and scholarship money directly into the beneficiary’s Aadhaar-linked bank account without middlemen.',
    simpleMeaningHi: 'सरकारी योजनाओं, छात्रवृत्ति या पेंशन का पैसा बिना किसी बिचौलिये के सीधे आपके आधार से जुड़े बैंक खाते में जमा होना।',
    context: 'Welfare Schemes & Subsidies',
    officialReference: 'DBT Mission, Government of India'
  },
  {
    officialTermEn: 'Non-Creamy Layer (NCL)',
    officialTermHi: 'नॉन-क्रीमी लेयर (NCL)',
    simpleMeaningEn: 'A category within OBC whose annual family income is below the prescribed threshold (currently ₹8 lakh/year), qualifying them for reservation benefits.',
    simpleMeaningHi: 'ओबीसी वर्ग के वे परिवार जिनकी वार्षिक पारिवारिक आय तय सीमा (वर्तमान में ₹8 लाख) से कम है और वे आरक्षण के पात्र हैं।',
    context: 'Caste & Income Certifications',
    officialReference: 'DoPT Guidelines on OBC Reservations'
  },
  {
    officialTermEn: 'Model Tenancy Act / Rent Agreement',
    officialTermHi: 'किराया समझौता / मॉडल टेनेंसी नियम',
    simpleMeaningEn: 'Rules governing the legal relationship between tenants and landlords, mandating written agreements, capping security deposits, and regulating eviction procedures.',
    simpleMeaningHi: 'मकान मालिक और किरायेदार के बीच लिखित समझौता, जिसमें सुरक्षा राशि (Security Deposit) और मकान खाली कराने के कानूनी नियम तय होते हैं।',
    context: 'Tenancy & Housing Rights',
    officialReference: 'Model Tenancy Act (MoHUA)'
  },
  {
    officialTermEn: 'Gazette Notification (राजपत्र अधिसूचना)',
    officialTermHi: 'सरकारी राजपत्र अधिसूचना (Gazette Notification)',
    simpleMeaningEn: 'The official published public journal of the Government of India or State Governments containing laws, rules, appointments, and official orders.',
    simpleMeaningHi: 'सरकार की आधिकारिक मुद्रित पत्रिका जिसमें नए कानून, नियम, आदेश और सरकारी घोषणाएं कानूनी रूप से लागू करने हेतु छापी जाती हैं।',
    context: 'Government Document Interpretation',
    officialReference: 'The Gazette of India (egazette.gov.in)'
  },
  {
    officialTermEn: 'Lok Adalat (People\'s Court)',
    officialTermHi: 'लोक अदालत (जनता की अदालत)',
    simpleMeaningEn: 'An alternative dispute resolution forum where civil, matrimonial, compoundable criminal, and consumer cases are settled amicably with no court fees and final binding awards.',
    simpleMeaningHi: 'न्यायालय द्वारा आयोजित ऐसा मंच जहां बिना किसी अदालती फीस के दोनों पक्षों की सहमति से विवादों का त्वरित और अंतिम निपटारा होता है।',
    context: 'Legal Services & Dispute Resolution',
    officialReference: 'Legal Services Authorities Act 1987'
  }
];
