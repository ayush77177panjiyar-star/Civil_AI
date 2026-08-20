import React, { useEffect, useState } from 'react';
import { Save, Trash2, UserRound, CheckCircle2, ShieldCheck, UserPlus } from 'lucide-react';
import { useUserData } from '../context/UserContext';
import { INDIAN_STATES_AND_UTS } from '../data/indianStates';
import { Language } from '../types';
import { AuthModal } from './AuthModal';

interface Props { language: Language; }

export const MyInformation: React.FC<Props> = ({ language }) => {
  const { userData, updateUserData, clearUserData, syncWithBackend, userId } = useUserData();
  const [savedBanner, setSavedBanner] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const profile = userData.profile || {
    phone: '', address: '', city: '', district: '', stateOrUt: '', pinCode: '', preferredLanguage: ''
  };

  const update = (field: keyof typeof profile, value: string) => {
    updateUserData('profile', { [field]: value });
  };

  const save = async () => {
    updateUserData('profile', { ...profile });
    await syncWithBackend();
    
    setSavedBanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    window.setTimeout(() => setSavedBanner(false), 5000);
  };

  const clear = async () => {
    if (!window.confirm('Delete your saved CivicAI information? This does not delete demo/example content.')) return;
    await clearUserData();
  };

  const labels: Record<string, Record<string,string>> = {
    en: { title: 'My Information', sub: 'Save information you frequently use. CivicAI will reuse it only when you choose to use saved information.', name: 'Full Name', email: 'Email Address', phone: 'Phone Number', address: 'Address', city: 'City / Town / Village', district: 'District', state: 'State / Union Territory', pin: 'PIN Code', save: 'Save Information', saved: 'Your Information Saved Successfully!', clear: 'Delete My Saved Information' },
    hi: { title: 'मेरी जानकारी', sub: 'बार-बार उपयोग होने वाली जानकारी सहेजें। CivicAI इसे केवल आपकी अनुमति से उपयोग करेगा।', name: 'पूरा नाम', email: 'ईमेल', phone: 'फ़ोन नंबर', address: 'पता', city: 'शहर / कस्बा / गाँव', district: 'ज़िला', state: 'राज्य / केंद्र शासित प्रदेश', pin: 'पिन कोड', save: 'जानकारी सहेजें', saved: 'आपकी जानकारी सफलतापूर्वक सहेजी गई!', clear: 'मेरी सहेजी जानकारी हटाएँ' }
  };
  const l = labels[language] || labels.en;

  return (
    <section className="max-w-4xl mx-auto p-4 sm:p-8">
      {savedBanner && (
        <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl shadow-lg border border-emerald-500 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-base">{l.saved}</h4>
              <p className="text-xs text-emerald-100">
                Data synchronized to central Supabase database for account: <span className="font-mono font-bold text-white">{userId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-1.5 bg-white text-emerald-900 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Set Custom User ID & Password</span>
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-7 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <UserRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{l.title}</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{l.sub}</p>
            </div>
          </div>

          <button
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Account: <span className="font-mono text-blue-700">{userId}</span></span>
          </button>
        </div>

        <div className="p-5 sm:p-7 grid sm:grid-cols-2 gap-4">
          <Field label={l.name} value={userData.name} onChange={v => updateUserData('name', () => v)} />
          <Field label={l.email} value={userData.email} type="email" onChange={v => updateUserData('email', () => v)} />
          <Field label={l.phone} value={profile.phone} type="tel" onChange={v => update('phone', v)} />
          <Field label={l.city} value={profile.city} onChange={v => update('city', v)} />
          <Field label={l.district} value={profile.district} onChange={v => update('district', v)} />
          <Field label={l.pin} value={profile.pinCode} inputMode="numeric" onChange={v => update('pinCode', v)} />
          <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
            {l.address}
            <textarea value={profile.address} onChange={e => update('address', e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
            {l.state}
            <select value={profile.stateOrUt} onChange={e => update('stateOrUt', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select State / Union Territory...</option>
              {INDIAN_STATES_AND_UTS.map(r => <option key={r.name} value={r.name}>{r.name}{r.type === 'UNION_TERRITORY' ? ' (UT)' : ''}</option>)}
            </select>
          </label>
        </div>

        <div className="px-5 sm:px-7 pb-6 flex flex-wrap items-center gap-3">
          <button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white px-5 py-3 font-bold hover:bg-blue-800 shadow-md uppercase tracking-wider text-xs transition-all">
            <Save className="w-4 h-4" />
            {l.save}
          </button>
          <button onClick={clear} className="inline-flex items-center gap-2 rounded-xl border border-red-200 text-red-700 px-4 py-2.5 font-semibold text-xs hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
            {l.clear}
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        language={language}
      />
    </section>
  );
};

function Field({label,value,onChange,type='text',inputMode}: {label:string;value:string;onChange:(v:string)=>void;type?:string;inputMode?:'numeric'}) {
  return <label className="text-sm font-semibold text-slate-700">{label}<input type={type} inputMode={inputMode} value={value || ''} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>;
}
