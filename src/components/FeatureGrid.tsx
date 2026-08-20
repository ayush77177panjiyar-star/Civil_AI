import React from 'react';
import { 
  FileText, 
  Scale, 
  Award, 
  FormInput, 
  BookOpenCheck, 
  ArrowUpRight, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Language } from '../types';

interface FeatureGridProps {
  language: Language;
  onSelectTab: (tab: string) => void;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  language,
  onSelectTab
}) => {
  const features = [
    {
      id: 'rti',
      title: language === 'hi' ? 'आरटीआई ड्राफ्टिंग एजेंट' : 'RTI Drafting Agent',
      icon: '📝',
      iconBg: 'from-amber-500 to-orange-600',
      badge: 'Section 6(1) Grounded',
      tagline: language === 'hi' 
        ? 'अपने सवाल को एक कानूनी रूप से संरचित आरटीआई आवेदन में बदलें।' 
        : 'Turn your informal question into a structured, record-seeking RTI application under Section 6(1).',
      highlights: [
        'Central vs. State jurisdiction detection & warning',
        'Converts "Why" queries into certified record requests',
        'Instant editable preview & professional PDF export'
      ],
      officialRef: 'RTI Online & State RTI Portals'
    },
    {
      id: 'rights',
      title: language === 'hi' ? 'अधिकार नेविगेटर' : 'Rights Navigator',
      icon: '⚖️',
      iconBg: 'from-blue-600 to-indigo-700',
      badge: 'Statutory Facts & Steps',
      tagline: language === 'hi'
        ? 'उपभोक्ता, किरायेदार, कर्मचारी और नागरिक अधिकारों को समझें।'
        : 'Understand your statutory rights, evidence checklist, and multi-tier escalation ladder.',
      highlights: [
        'Distinguishes Verified Facts vs. Interpretations',
        'Interactive Evidence Checklist & preparation',
        'Direct connection to National Consumer Helpline & e-Daakhil'
      ],
      officialRef: 'Consumer Protection Act & Model Tenancy'
    },
    {
      id: 'schemes',
      title: language === 'hi' ? 'योजना पात्रता रीडर' : 'Scheme Eligibility Reader',
      icon: '🏛️',
      iconBg: 'from-emerald-600 to-teal-700',
      badge: 'myScheme Powered Model',
      tagline: language === 'hi'
        ? 'अपनी आयु, आय व व्यवसाय के आधार पर सरकारी कल्याणकारी योजनाएं खोजें।'
        : 'Discover Central and State welfare schemes you may qualify for through conversational interview.',
      highlights: [
        'Interactive conversational eligibility interview',
        'No false promises: "Potentially eligible" confidence logic',
        'Detailed documentation checklist & direct application steps'
      ],
      officialRef: 'myScheme.gov.in Reference Model'
    },
    {
      id: 'forms',
      title: language === 'hi' ? 'संवादी फॉर्म-फिलर' : 'Conversational Form-Filler',
      icon: '📄',
      iconBg: 'from-purple-600 to-pink-600',
      badge: 'Intelligent Step-by-Step',
      tagline: language === 'hi'
        ? 'एक-एक प्रश्न का उत्तर दें और अपना सरकारी आवेदन पत्र तैयार करें।'
        : 'Answer natural questions step-by-step and generate an authoritative, compliant application.',
      highlights: [
        'Zero hallucination of personal data',
        'Live synchronized preview as you answer questions',
        'Print-ready, editable, and PDF download options'
      ],
      officialRef: 'Standard Government Form Formats'
    },
    {
      id: 'document',
      title: language === 'hi' ? 'दस्तावेज़ अनुवादक' : 'Document Interpreter',
      icon: '📚',
      iconBg: 'from-sky-600 to-blue-700',
      badge: 'Multimodal OCR & Analysis',
      tagline: language === 'hi'
        ? 'सरकारी नोटिस, सर्कुलर व राजपत्र को सरल नागरिक भाषा में समझें।'
        : 'Upload complex government PDFs, notices, or circulars and extract dates, actions & meanings.',
      highlights: [
        'Demystifies dense bureaucratic & legal terminology',
        'Pinpoints exact deadlines, fees, and required actions',
        'Precise page and section citations with OCR confidence'
      ],
      officialRef: 'The Gazette of India & Department Orders'
    }
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          5 Core Illustrative Pillars
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">
          {language === 'hi' ? 'विशेषीकृत नागरिक उपकरण' : 'Specialized Civic & Legal Action Tools'}
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mt-2">
          {language === 'hi'
            ? 'प्रत्येक उपकरण को भारत के संवैधानिक और प्रशासनिक नियमों के अनुसार सटीक कार्यप्रणाली प्रदान करने के लिए तैयार किया गया है।'
            : 'Each dedicated engine is engineered to solve a specific civic hurdle with grounded accuracy and zero hallucination.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, index) => (
          <div
            key={feat.id}
            id={`feature-card-${feat.id}`}
            onClick={() => onSelectTab(feat.id)}
            className={`group relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-500/60 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between ${
              index === 4 ? 'md:col-span-2 lg:col-span-1' : ''
            }`}
          >
            <div>
              {/* Header with Icon and Badge */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {feat.badge}
                </span>
              </div>

              {/* Title & Tagline */}
              <h3 className="text-lg font-bold text-slate-900 font-serif group-hover:text-blue-600 transition-colors mb-2">
                {feat.title}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed">
                {feat.tagline}
              </p>

              {/* Highlight Bullets */}
              <div className="space-y-2 mb-6 pt-3 border-t border-slate-100">
                {feat.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with Destination Link */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium truncate max-w-[180px]">
                {feat.officialRef}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                Launch <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
