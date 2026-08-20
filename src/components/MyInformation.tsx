import React, { useEffect, useState } from 'react';
import { Save, Trash2, UserRound } from 'lucide-react';
import { useUserData } from '../context/UserContext';
import { INDIAN_STATES_AND_UTS } from '../data/indianStates';
import { Language } from '../types';

interface Props { language: Language; }

export const MyInformation: React.FC<Props> = ({ language }) => {
  const { userData, updateUserData, clearUserData } = useUserData();
  const [saved, setSaved] = useState(false);
  const profile = userData.profile || {
    phone: '', address: '', city: '', district: '', stateOrUt: '', pinCode: '', preferredLanguage: ''
  };

  useEffect(() => {
    setSaved(false);
  }, [userData.lastUpdated]);

  const update = (field: keyof typeof profile, value: string) => {
    updateUserData('profile', { [field]: value });
  };

  const save = () => {
    updateUserData('profile', { ...profile });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const clear = async () => {
    if (!window.confirm('Delete your saved CivicAI information? This does not delete demo/example content.')) return;
    await clearUserData();
  };

  const labels: Record<string, Record<string,string>> = {
    en: { title: 'My Information', sub: 'Save information you frequently use. CivicAI will reuse it only when you choose to use saved information.', name: 'Full Name', email: 'Email', phone: 'Phone Number', address: 'Address', city: 'City / Town / Village', district: 'District', state: 'State / Union Territory', pin: 'PIN Code', save: 'Save Information', saved: 'Saved', clear: 'Delete My Saved Information' },
    hi: { title: 'मेरी जानकारी', sub: 'बार-बार उपयोग होने वाली जानकारी सहेजें। CivicAI इसे केवल आपकी अनुमति से उपयोग करेगा।', name: 'पूरा नाम', email: 'ईमेल', phone: 'फ़ोन नंबर', address: 'पता', city: 'शहर / कस्बा / गाँव', district: 'ज़िला', state: 'राज्य / केंद्र शासित प्रदेश', pin: 'पिन कोड', save: 'जानकारी सहेजें', saved: 'सहेजा गया', clear: 'मेरी सहेजी जानकारी हटाएँ' }
  };
  const l = labels[language] || labels.en;

  return (
    <section className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-7 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><UserRound className="w-5 h-5" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{l.title}</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{l.sub}</p>
            </div>
          </div>
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
          <button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white px-4 py-2.5 font-semibold hover:bg-blue-800"><Save className="w-4 h-4" />{saved ? l.saved : l.save}</button>
          <button onClick={clear} className="inline-flex items-center gap-2 rounded-xl border border-red-200 text-red-700 px-4 py-2.5 font-semibold hover:bg-red-50"><Trash2 className="w-4 h-4" />{l.clear}</button>
          <span className="text-xs text-slate-400">Only the fields required by a tool should be included in an AI request.</span>
        </div>
      </div>
    </section>
  );
};

function Field({label,value,onChange,type='text',inputMode}: {label:string;value:string;onChange:(v:string)=>void;type?:string;inputMode?:'numeric'}) {
  return <label className="text-sm font-semibold text-slate-700">{label}<input type={type} inputMode={inputMode} value={value || ''} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>;
}
