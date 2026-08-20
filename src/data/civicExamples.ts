import { Language } from '../types';

export interface CivicExample {
  type: 'example';
  id: string;
  tool: 'rti' | 'rights' | 'scheme' | 'form' | 'document' | 'general';
  title: Record<string, string>;
  description: Record<string, string>;
  categoryLabel: Record<string, string>;
  sampleData: any;
  guidanceNotes: Record<string, string>;
}

export const CIVIC_EXAMPLES: Record<string, CivicExample[]> = {
  rti: [
    {
      type: 'example',
      id: 'ex-rti-road',
      tool: 'rti',
      title: {
        en: 'Village Road Sanction & Expenditure Inquiry',
        hi: 'ग्राम सड़क निर्माण एवं व्यय विवरण हेतु आरटीआई',
        mr: 'गाव रस्ता बांधकाम आणि खर्च चौकशीसाठी आरटीआय',
        bn: 'গ্রামের রাস্তা নির্মাণ ও ব্যয়ের তথ্যের জন্য আরটিআই',
        te: 'గ్రామ రహదారి నిధులు & ఖర్చు వివరాల RTI',
        ta: 'கிராம சாலை நிதி & செலவு குறித்த RTI',
        gu: 'ગામડાના રોડ નિર્માણ અને ખર્ચની માહિતી માટે RTI',
        kn: 'ಗ್ರಾಮ ರಸ್ತೆ ಕಾಮಗಾರಿ ಮತ್ತು ವೆಚ್ಚದ RTI',
        ml: 'ഗ്രാമ റോഡ് ഫണ്ട് സംബന്ധിച്ച വിവരാവകാശ അപേക്ഷ',
        pa: 'ਪਿੰਡ ਦੀ ਸੜਕ ਨਿਰਮਾਣ ਤੇ ਖਰਚੇ ਦੀ RTI',
        or: 'ଗ୍ରାମ ରାସ୍ତା ନିର୍ମାଣ ଓ ଖର୍ଚ୍ଚ ସମ୍ବନ୍ଧୀୟ RTI',
        as: 'গাঁওৰ পথ নিৰ্মাণ আৰু ব্যয়ৰ RTI',
        ur: 'گاؤں کی سڑک کی تعمیر اور اخراجات کی آر ٹی آئی',
        ne: 'गाउँको सडक निर्माण तथा खर्च सम्बन्धी RTI'
      },
      description: {
        en: 'I want to know the sanctioned budget, approved contractor, completion timeline, and certified vouchers for the road construction in my village sanctioned under the rural infrastructure scheme.',
        hi: 'मैं अपने गांव में स्वीकृत ग्रामीण सड़क निर्माण योजना का स्वीकृत बजट, संवेदक का नाम, कार्य पूर्ण होने की समय-सीमा और प्रमाणित व्यय वाउचर की जानकारी चाहता हूं।',
        mr: 'माझ्या गावातील मंजूर रस्ता कामाचा निधी, ठेकेदाराचे नाव, कामाची मुदत आणि खर्चाच्या प्रमाणित पावत्यांची माहिती मला हवी आहे.',
        bn: 'আমি আমার গ্রামে গ্রামীণ অবকাঠামো প্রকল্পের অধীনে অনুমোদিত রাস্তা নির্মাণের বাজেট, ঠিকাদার এবং খরচের ভাউচারের বিবরণ জানতে চাই।',
        te: 'మా గ్రామంలో మంజూరైన రహదారి నిర్మాణ బడ్జెట్, కాంట్రాక్టర్ వివరాలు మరియు ఖర్చుల ధృవీకరించిన రసీదుల సమాచారం కావాలి.',
        ta: 'எங்கள் கிராமத்தில் ஒப்புதல் அளிக்கப்பட்ட சாலை திட்டத்தின் நிதி, ஒப்பந்ததாரர் மற்றும் சான்றளிக்கப்பட்ட செலவு ரசீதுகள் விவரங்களை அறிய விரும்புகிறேன்.',
        gu: 'મારા ગામમાં મંજૂર થયેલ ગ્રામીણ રોડ પ્રોજેક્ટના બજેટ, કોન્ટ્રાક્ટરની વિગતો અને ખર્ચના વાઉચરોની માહિતી જોઈએ છે.',
        kn: 'ನಮ್ಮ ಹಳ್ಳಿಯ ರಸ್ತೆ ನಿರ್ಮಾಣಕ್ಕೆ ಮಂಜೂರಾದ ಬಜೆಟ್, ಗುತ್ತಿಗೆದಾರರ ವಿವರ ಮತ್ತು ವೆಚ್ಚದ ಪ್ರಮಾಣೀಕೃತ ದಾಖಲೆಗಳ ಮಾಹಿತಿ ಬೇಕು.',
        ml: 'ഞങ്ങളുടെ ഗ്രാമത്തിലെ റോഡ് നിർമ്മാണത്തിനായി അനുവദിച്ച ബജറ്റും ചെലവ് വിവരങ്ങളും കരാറുകാരന്റെ വിവരങ്ങളും അറിയണം.',
        pa: 'ਮੇਰੇ ਪਿੰਡ ਦੀ ਸੜਕ ਦੇ ਮਨਜ਼ੂਰ ਫੰਡ, ਠੇਕੇਦਾਰ ਅਤੇ ਖਰਚੇ ਦੇ ਵਾਊਚਰਾਂ ਬਾਰੇ ਜਾਣਕਾਰੀ ਚਾਹੀਦੀ ਹੈ।',
        or: 'ଆମ ଗ୍ରାମର ରାସ୍ତା ନିର୍ମାଣ ପାଇଁ ମଞ୍ଜୁର ହୋଇଥିବା ଅର୍ଥ, ଠିକାଦାର ଏବଂ ଖର୍ଚ୍ଚ ଭାଉଚର ବିବରଣୀ ଜାଣିବାକୁ ଚାହୁଁଛି।',
        as: 'মোৰ গাঁৱৰ পথ নিৰ্মাণৰ বাবে অনুমোদন কৰা ধন আৰু খৰচৰ প্ৰমাণিত তথ্য বিচাৰোঁ।',
        ur: 'میں اپنے گاؤں میں منظور شدہ سڑک کی تعمیر کا بجٹ، ٹھیکیدار اور اخراجات کے واؤچرز کی معلومات چاہتا ہوں۔',
        ne: 'मेरो गाउँमा स्वीकृत सडक निर्माणको बजेट, ठेकेदार र खर्चको प्रमाणित विवरणको जानकारी चाहन्छु।'
      },
      categoryLabel: {
        en: 'Rural Infrastructure & Public Works',
        hi: 'ग्रामीण अवसंरचना एवं लोक निर्माण',
        mr: 'ग्रामीण पायाभूत सुविधा व सार्वजनिक बांधकाम'
      },
      sampleData: {
        problemQuery: 'I want to know the sanctioned budget, approved contractor, completion timeline, and certified vouchers for the road construction in my village sanctioned under the rural infrastructure scheme.',
        stateOrUt: 'National / Any State',
        suggestedDepartment: 'Panchayati Raj & Rural Works Department'
      },
      guidanceNotes: {
        en: 'Under Section 6(1) of the RTI Act 2005, public authorities are mandated to provide certified copies of work orders and measurement books.',
        hi: 'सूचना का अधिकार अधिनियम 2005 की धारा 6(1) के तहत कार्य आदेश और माप पुस्तिका (Measurement Book) की प्रमाणित प्रतियां प्राप्त की जा सकती हैं।'
      }
    },
    {
      type: 'example',
      id: 'ex-rti-ration',
      tool: 'rti',
      title: {
        en: 'Fair Price Shop Ration Allocation & Stock Register',
        hi: 'राशन दुकान स्टॉक रजिस्टर एवं आवंटन रिकॉर्ड',
        mr: 'रास्त भाव धान्य दुकान साठा व वाटप नोंदवही',
        bn: 'রেশন দোকান স্টক ও বণ্টন রেজিস্টার'
      },
      description: {
        en: 'I want to inspect the monthly foodgrain allocation and sales register of Fair Price Shop No. 12 for the last 6 months.',
        hi: 'मैं पिछले 6 महीनों के लिए उचित मूल्य की दुकान संख्या 12 के मासिक खाद्यान्न आवंटन और बिक्री रजिस्टर का निरीक्षण करना चाहता हूं।'
      },
      categoryLabel: {
        en: 'Food & Civil Supplies (NFSA)',
        hi: 'खाद्य एवं नागरिक आपूर्ति'
      },
      sampleData: {
        problemQuery: 'I want to inspect the monthly foodgrain allocation and sales register of Fair Price Shop No. 12 for the last 6 months under National Food Security Act.',
        stateOrUt: 'National / Any State',
        suggestedDepartment: 'Department of Food & Civil Supplies'
      },
      guidanceNotes: {
        en: 'Citizens have the right to inspect work, documents, and records under Section 2(j)(i) of the RTI Act.',
        hi: 'आरटीआई अधिनियम की धारा 2(j)(i) के तहत नागरिक रिकॉर्ड और कार्य का भौतिक निरीक्षण कर सकते हैं।'
      }
    }
  ],

  rights: [
    {
      type: 'example',
      id: 'ex-rights-ecommerce',
      tool: 'rights',
      title: {
        en: 'E-commerce Non-Delivery & Refusal of Refund',
        hi: 'ऑनलाइन खरीद: सामान न मिलना और रिफंड से इनकार',
        mr: 'ऑनलाइन खरेदी: वस्तू न मिळणे व परतावा नाकारणे',
        bn: 'অনলাইন কেনাকাটা: পণ্য না পাওয়া এবং রিফান্ড অস্বীকার'
      },
      description: {
        en: 'I ordered and prepaid ₹18,500 for a home appliance on an online shopping portal 25 days ago. The product was never delivered and customer support is repeatedly closing tickets without issuing a refund.',
        hi: 'मैंने 25 दिन पहले एक ई-कॉमर्स पोर्टल पर ₹18,500 का अग्रिम भुगतान करके एक घरेलू उपकरण का ऑर्डर दिया था। उत्पाद कभी डिलीवर नहीं हुआ और ग्राहक सहायता बिना रिफंड किए टिकट बंद कर रही है।'
      },
      categoryLabel: {
        en: 'Consumer Protection Act 2019 (Deficiency in Service)',
        hi: 'उपभोक्ता संरक्षण अधिनियम 2019 (सेवा में कमी)'
      },
      sampleData: {
        problemQuery: 'I ordered and prepaid ₹18,500 for a home appliance on an online shopping portal 25 days ago. The product was never delivered and customer support is repeatedly closing tickets without issuing a refund.',
        contextDetails: 'Payment made via UPI with transaction ID, 4 follow-up emails sent, 15 days past guaranteed delivery window.'
      },
      guidanceNotes: {
        en: 'Under Consumer Protection (E-Commerce) Rules 2020, platforms must acknowledge refunds within 48 hours and process within 14 days.',
        hi: 'उपभोक्ता संरक्षण (ई-कॉमर्स) नियम 2020 के तहत ई-कॉमर्स कंपनियों को 48 घंटे में शिकायत स्वीकार कर 14 दिनों के भीतर रिफंड संसाधित करना अनिवार्य है।'
      }
    },
    {
      type: 'example',
      id: 'ex-rights-tenancy',
      tool: 'rights',
      title: {
        en: 'Landlord Withholding Security Deposit Unlawfully',
        hi: 'मकान मालिक द्वारा अवैध रूप से सुरक्षा जमा (Deposit) रोकना',
        mr: 'घरमालकाने अनामत रक्कम (Deposit) बेकायदेशीरपणे रोखणे'
      },
      description: {
        en: 'I vacated my rented apartment after serving 1 month notice as per agreement. The landlord is refusing to refund my ₹45,000 security deposit despite zero damage.',
        hi: 'मैंने समझौते के अनुसार 1 महीने का नोटिस देकर किराए का फ्लैट खाली कर दिया। फ्लैट में कोई नुकसान न होने के बावजूद मकान मालिक मेरी ₹45,000 की सुरक्षा जमा राशि वापस करने से मना कर रहा है।'
      },
      categoryLabel: {
        en: 'Model Tenancy Act & State Rent Authority',
        hi: 'मॉडल किरायेदारी अधिनियम एवं किराया प्राधिकरण'
      },
      sampleData: {
        problemQuery: 'I vacated my rented apartment after serving 1 month notice as per agreement. The landlord is refusing to refund my ₹45,000 security deposit despite zero damage.',
        contextDetails: 'Written rental agreement available, handover video recorded, rent receipts clear.'
      },
      guidanceNotes: {
        en: 'Model Tenancy Act mandates refund of security deposit on vacating premises after due deduction of agreed arrears.',
        hi: 'मॉडल टेनेंसी एक्ट के तहत परिसर खाली करने पर नियत कटौती के बाद सुरक्षा जमा तत्काल वापस करना अनिवार्य है।'
      }
    }
  ],

  scheme: [
    {
      type: 'example',
      id: 'ex-scheme-student',
      tool: 'scheme',
      title: {
        en: 'Higher Education Scholarship (Student, Family Income < ₹2.5L)',
        hi: 'उच्च शिक्षा छात्रवृत्ति (छात्र, पारिवारिक आय ₹2.5 लाख से कम)',
        mr: 'उच्च शिक्षण शिष्यवृत्ती (विद्यार्थी, कौटुंबिक उत्पन्न २.५ लाखांपेक्षा कमी)'
      },
      description: {
        en: 'I am a 20-year-old student enrolled in an undergraduate degree course. My annual family income is ₹2,20,000. Which central and state scholarship schemes am I eligible for?',
        hi: 'मैं 20 वर्षीय स्नातक (Undergraduate) छात्र हूं। मेरी वार्षिक पारिवारिक आय ₹2,20,000 है। मैं किन केंद्रीय और राज्य छात्रवृत्ति योजनाओं के लिए पात्र हूं?'
      },
      categoryLabel: {
        en: 'Education & Direct Benefit Transfer (DBT)',
        hi: 'शिक्षा एवं प्रत्यक्ष लाभ अंतरण (DBT)'
      },
      sampleData: {
        age: '20',
        stateOrUt: 'All States / Pan-India',
        annualIncome: '220000',
        occupation: 'Student',
        gender: 'All',
        category: 'OBC / EWS / General',
        isStudent: true,
        query: 'I am a 20-year-old college student. My annual family income is ₹2.2 lakh. Which government scholarship schemes can I apply for?'
      },
      guidanceNotes: {
        en: 'Post-Matric Scholarship Scheme (Ministry of Social Justice & MoE) covers tuition fees and maintenance allowance for eligible students with family income under ₹2.5 Lakh.',
        hi: 'पोस्ट-मैट्रिक छात्रवृत्ति योजना (शिक्षा मंत्रालय एवं सामाजिक न्याय मंत्रालय) के तहत ₹2.5 लाख से कम वार्षिक आय वाले छात्रों को शिक्षण शुल्क व भत्ता मिलता है।'
      }
    },
    {
      type: 'example',
      id: 'ex-scheme-farmer',
      tool: 'scheme',
      title: {
        en: 'Small Farmer Direct Support & Crop Insurance',
        hi: 'लघु किसान प्रत्यक्ष सहायता एवं फसल बीमा',
        mr: 'अल्पभूधारक शेतकरी थेट मदत व पीक विमा'
      },
      description: {
        en: 'I am a 42-year-old small farmer with 1.5 acres of cultivable land. What agricultural financial assistance and crop insurance schemes are available?',
        hi: 'मैं 42 वर्षीय लघु किसान हूं जिसके पास 1.5 एकड़ कृषि योग्य भूमि है। मेरे लिए कौन सी वित्तीय सहायता और फसल बीमा योजनाएं उपलब्ध हैं?'
      },
      categoryLabel: {
        en: 'Agriculture & Livelihood (PM-KISAN / PMFBY)',
        hi: 'कृषि एवं आजीविका'
      },
      sampleData: {
        age: '42',
        stateOrUt: 'All States',
        annualIncome: '120000',
        occupation: 'Farmer / Agriculture',
        gender: 'Male',
        category: 'Small / Marginal Farmer',
        isStudent: false,
        query: 'Small farmer with 1.5 acres land seeking financial support and subsidized seed/machinery schemes.'
      },
      guidanceNotes: {
        en: 'Eligible for PM-KISAN (₹6,000/yr), PM Fasal Bima Yojana, and Kisan Credit Card (subsidized interest rate).',
        hi: 'पीएम-किसान (₹6,000/वर्ष), पीएम फसल बीमा योजना और किसान क्रेडिट कार्ड (रियायती ब्याज) हेतु पात्र।'
      }
    }
  ],

  form: [
    {
      type: 'example',
      id: 'ex-form-income',
      tool: 'form',
      title: {
        en: 'Income Certificate Application (Tahsil / Revenue Office)',
        hi: 'आय प्रमाण पत्र आवेदन (तहसील / राजस्व कार्यालय)',
        mr: 'उत्पन्न प्रमाणपत्र अर्ज (तहसील / महसूल कार्यालय)'
      },
      description: {
        en: 'Prepare a formal application statement to the Tahsildar for issuance of an Annual Family Income Certificate for scholarship/welfare purposes.',
        hi: 'छात्रवृत्ति/कल्याणकारी योजनाओं के लिए वार्षिक पारिवारिक आय प्रमाण पत्र जारी करने हेतु तहसीलदार के समक्ष औपचारिक आवेदन तैयार करें।'
      },
      categoryLabel: {
        en: 'Revenue & Citizen Service Portal (e-District)',
        hi: 'राजस्व एवं ई-डिस्ट्रिक्ट नागरिक सेवाएं'
      },
      sampleData: {
        templateId: 'income-cert',
        applicantName: 'Sample Citizen',
        purpose: 'Scholarship Application',
        annualIncome: '180000',
        district: 'District Headquarters'
      },
      guidanceNotes: {
        en: 'Income certificates are typically processed via State e-District portal requiring ration card, electricity bill, and self-declaration affidavit.',
        hi: 'आय प्रमाण पत्र राज्य के ई-डिस्ट्रिक्ट पोर्टल के माध्यम से राशन कार्ड, बिजली बिल और स्व-घोषणा शपथ पत्र के साथ जारी होता है।'
      }
    }
  ],

  document: [
    {
      type: 'example',
      id: 'ex-doc-notice',
      tool: 'document',
      title: {
        en: 'Municipal Property Tax Show Cause & Revision Notice',
        hi: 'नगर निगम संपत्ति कर संशोधन एवं कारण बताओ नोटिस',
        mr: 'महानगरपालिका मालमत्ता कर सुधारणा व कारणे दाखवा नोटीस'
      },
      description: {
        en: 'Understand the legal implications, 30-day deadline, objection procedure, and penalty clauses mentioned in an official municipal reassessment order.',
        hi: 'नगर निगम के संपत्ति कर पुनर्मूल्यांकन आदेश में दी गई 30 दिनों की समय-सीमा, आपत्ति दर्ज करने की प्रक्रिया और जुर्माने के प्रावधानों को सरल भाषा में समझें।'
      },
      categoryLabel: {
        en: 'Municipal Corporation Act (Statutory Notice)',
        hi: 'नगर निगम अधिनियम (सांविधिक नोटिस)'
      },
      sampleData: {
        title: 'Municipal Property Reassessment Notice',
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
      guidanceNotes: {
        en: 'The document mandates filing objections within 30 days before the provisional assessment becomes final.',
        hi: 'नोटिस के अनुसार 30 दिनों के भीतर उप नगर आयुक्त के समक्ष लिखित आपत्ति दर्ज करना अनिवार्य है।'
      }
    }
  ],

  general: [
    {
      type: 'example',
      id: 'ex-gen-rti',
      tool: 'general',
      title: {
        en: 'What is RTI and how does it work?',
        hi: 'सूचना का अधिकार (RTI) क्या है और यह कैसे काम करता है?',
        mr: 'माहिती अधिकार (RTI) म्हणजे काय आणि ते कसे चालते?'
      },
      description: {
        en: 'A citizen wants to understand what the Right to Information Act 2005 is, what fee applies, and how public authorities respond.',
        hi: 'नागरिक यह समझना चाहता है कि आरटीआई क्या है, इसका शुल्क कितना है और सरकारी विभाग इसका उत्तर कैसे देते हैं।'
      },
      categoryLabel: {
        en: 'Informational Civic Query',
        hi: 'नागरिक सूचना'
      },
      sampleData: {
        query: 'What is the Right to Information Act (RTI) and who can file it?'
      },
      guidanceNotes: {
        en: 'Any Indian citizen can file an RTI under Section 6(1) for a standard ₹10 fee.',
        hi: 'कोई भी भारतीय नागरिक धारा 6(1) के तहत ₹10 शुल्क में आरटीआई आवेदन कर सकता है।'
      }
    },
    {
      type: 'example',
      id: 'ex-gen-road',
      tool: 'general',
      title: {
        en: 'Village Road Construction Complaint',
        hi: 'गांव की सड़क निर्माण में अनियमितता की शिकायत',
        mr: 'गावातील रस्ता बांधकामातील अनियमिततेची तक्रार'
      },
      description: {
        en: 'A citizen asks about action when sanctioned rural road work is substandard or incomplete.',
        hi: 'स्वीकृत सड़क का काम अधूरा या घटिया होने पर क्या कदम उठाए जा सकते हैं।'
      },
      categoryLabel: {
        en: 'Grievance Redressal & RTI',
        hi: 'शिकायत निवारण एवं आरटीआई'
      },
      sampleData: {
        query: 'My village road was sanctioned under Gram Sadak scheme 2 years ago but work is still incomplete. How can I find out the contractor name and file a complaint?'
      },
      guidanceNotes: {
        en: 'Can be pursued via RTI for expenditure audit and State Grievance Redressal Portal (CM Helpline/CPGRAMS).',
        hi: 'खर्च की जांच हेतु आरटीआई और शिकायत हेतु सीपीग्राम्स या राज्य सीएम हेल्पलाइन का उपयोग किया जा सकता है।'
      }
    }
  ]
};

export function getExamplesForTool(tool: string): CivicExample[] {
  return CIVIC_EXAMPLES[tool] || CIVIC_EXAMPLES.general;
}

export function getLocalizedExampleText(example: CivicExample, lang: Language): { title: string; description: string; notes?: string } {
  const langCode = lang.toLowerCase();
  const title = example.title[langCode] || example.title.en || Object.values(example.title)[0] || '';
  const description = example.description[langCode] || example.description.en || Object.values(example.description)[0] || '';
  const notes = example.guidanceNotes ? (example.guidanceNotes[langCode] || example.guidanceNotes.en) : undefined;
  return { title, description, notes };
}
