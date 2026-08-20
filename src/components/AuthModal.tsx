import React, { useState } from 'react';
import { X, UserCheck, KeyRound, AlertCircle, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Language } from '../types';
import { useUserData } from '../context/UserContext';
import { registerUserInSupabase, loginUserInSupabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  initialMode = 'register'
}) => {
  const { setUserId, updateUserData, syncWithBackend } = useUserData();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  const [userIdInput, setUserIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanId = userIdInput.trim();
    if (!cleanId) {
      setErrorMsg('Please enter a valid User ID.');
      return;
    }
    if (!passwordInput || passwordInput.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. First attempt backend API call
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanId,
          password: passwordInput,
          email: emailInput,
          fullName: fullNameInput
        })
      }).catch(() => null);

      if (response && response.ok) {
        const resData = await response.json();
        if (!resData.success) {
          setErrorMsg(resData.error?.message || 'This User ID already exists. Please choose a different User ID or login.');
          setIsLoading(false);
          return;
        }
      } else {
        // Direct Supabase fallback
        const supaRes = await registerUserInSupabase(cleanId, passwordInput, emailInput, fullNameInput);
        if (!supaRes.success) {
          setErrorMsg(supaRes.error || 'This User ID already exists. Please choose a different User ID or login.');
          setIsLoading(false);
          return;
        }
      }

      // Successful Registration
      setUserId(cleanId);
      if (fullNameInput) updateUserData('name', () => fullNameInput);
      if (emailInput) updateUserData('email', () => emailInput);
      await syncWithBackend();

      setSuccessMsg('Account created successfully! Welcome to CivicAI.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred during account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanId = userIdInput.trim();
    if (!cleanId || !passwordInput) {
      setErrorMsg('Please enter both User ID and Password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanId,
          password: passwordInput
        })
      }).catch(() => null);

      if (response && response.ok) {
        const resData = await response.json();
        if (!resData.success) {
          setErrorMsg(resData.error?.message || 'Invalid User ID or password. Please check your credentials.');
          setIsLoading(false);
          return;
        }
        setUserId(cleanId);
      } else {
        const supaRes = await loginUserInSupabase(cleanId, passwordInput);
        if (!supaRes.success) {
          setErrorMsg(supaRes.error || 'Invalid User ID or password. Please check your credentials.');
          setIsLoading(false);
          return;
        }
        setUserId(cleanId);
      }

      setSuccessMsg(`Welcome back, ${cleanId}! Loaded past activity history.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg('Invalid User ID or password. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              {mode === 'register' ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base font-serif">
                {mode === 'register' ? 'Create Custom User Account' : 'Sign In to Your Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'register' ? 'Secure unique User ID & password setup' : 'Access your saved RTI drafts & activity history'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New User Registration
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Existing User Sign In
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Custom User ID (Unique) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={userIdInput}
              onChange={e => setUserIdInput(e.target.value)}
              placeholder="e.g. rahul_patna_2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Must be unique. This ID retrieves all your saved RTI drafts & activity history.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="Enter secure password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={fullNameInput}
                  onChange={e => setFullNameInput(e.target.value)}
                  placeholder="Rahul Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50"
                />
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : mode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Save Profile</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Account</span>
                </>
              )}
            </button>
          </div>

        </form>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500">
            Centralized Supabase RLS Database guarantees end-to-end security and multi-tenant isolation.
          </p>
        </div>
      </div>
    </div>
  );
};
