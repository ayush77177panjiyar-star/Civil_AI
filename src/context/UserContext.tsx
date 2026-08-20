import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_DEMO_SCENARIOS, DemoScenariosPackage } from '../data/demoScenarios';
import { CitizenProfile, RtiDraftData, RightsAnalysisResult, SchemeEvaluationResponse, DocumentInterpretationResult } from '../types';
import { 
  saveUserDataToSupabase, 
  fetchUserDataFromSupabase, 
  saveUserActivityToSupabase, 
  fetchUserActivitiesFromSupabase,
  UserActivityRecord 
} from '../lib/supabase';

export interface UserRtiState {
  problemQuery: string;
  stateOrUt: string;
  applicantDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  answers: Record<string, string>;
  generatedDraft: RtiDraftData | null;
}

export interface UserSchemeState {
  profile: CitizenProfile;
  evaluation: SchemeEvaluationResponse | null;
  savedSchemeIds: string[];
}

export interface UserRightsState {
  problemQuery: string;
  contextDetails: string;
  result: RightsAnalysisResult | null;
}

export interface UserFormState {
  selectedTemplateId: string;
  answers: Record<string, string>;
  generatedDocumentText?: string;
}

export interface UserDocumentState {
  docText: string;
  docTitle: string;
  result: DocumentInterpretationResult | null;
}

export interface RealUserData {
  type: 'user';
  id: string;
  name: string;
  email: string;
  profile: {
    phone: string;
    address: string;
    city: string;
    district: string;
    stateOrUt: string;
    pinCode: string;
    preferredLanguage?: string;
  };
  createdAt: string;
  lastUpdated: string;
  rti: UserRtiState;
  scheme: UserSchemeState;
  rights: UserRightsState;
  form: UserFormState;
  document: UserDocumentState;
}

export interface ActivityItem {
  id: string;
  type: string;
  activityType: 'rti_draft' | 'document_analysis' | 'scheme_check' | 'rights_analysis' | 'form_application';
  title: string;
  date: string;
  tab: string;
  icon: string;
  payload?: any;
}

export const INITIAL_USER_DATA = (userId: string): RealUserData => ({
  type: 'user',
  id: userId,
  name: '',
  email: '',
  profile: {
    phone: '',
    address: '',
    city: '',
    district: '',
    stateOrUt: '',
    pinCode: '',
    preferredLanguage: ''
  },
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  rti: {
    problemQuery: '',
    stateOrUt: '',
    applicantDetails: {
      name: '',
      address: '',
      phone: '',
      email: ''
    },
    answers: {},
    generatedDraft: null
  },
  scheme: {
    profile: {
      age: '',
      stateOrUt: '',
      annualIncome: '',
      occupation: '',
      gender: 'All',
      category: '',
      isStudent: false
    },
    evaluation: null,
    savedSchemeIds: []
  },
  rights: {
    problemQuery: '',
    contextDetails: '',
    result: null
  },
  form: {
    selectedTemplateId: 'income-cert',
    answers: {},
    generatedDocumentText: undefined
  },
  document: {
    docText: '',
    docTitle: '',
    result: null
  }
});

export type DataMode = 'USER' | 'DEMO';

interface UserContextType {
  userId: string;
  dataMode: DataMode;
  isInitialChoiceMade: boolean;
  demoData: DemoScenariosPackage;
  userData: RealUserData;
  activities: ActivityItem[];
  setUserId: (id: string) => void;
  setDataMode: (mode: DataMode) => void;
  chooseMode: (mode: DataMode) => void;
  updateUserData: <K extends keyof RealUserData>(section: K, data: Partial<RealUserData[K]> | ((prev: RealUserData[K]) => RealUserData[K])) => void;
  updateDemoData: <K extends keyof DemoScenariosPackage>(section: K, data: Partial<DemoScenariosPackage[K]> | ((prev: DemoScenariosPackage[K]) => DemoScenariosPackage[K])) => void;
  resetDemo: () => void;
  clearUserData: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  recordActivity: (
    activityType: ActivityItem['activityType'],
    title: string,
    tab: string,
    icon: string,
    payload?: any
  ) => Promise<void>;
  clearActivities: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'civicai_demo_state_v2';
const ACTIVE_USER_ID_KEY = 'civicai_active_user_id';
const MODE_STORAGE_KEY = 'civicai_data_mode';

function getOrGenerateUserId(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_USER_ID_KEY);
    if (saved && saved.trim()) return saved.trim();
    const newId = `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    localStorage.setItem(ACTIVE_USER_ID_KEY, newId);
    return newId;
  } catch (e) {
    return `user_${Date.now().toString(36)}`;
  }
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserIdState] = useState<string>(() => getOrGenerateUserId());
  const [dataMode, setDataModeState] = useState<DataMode>('USER');
  const [isInitialChoiceMade, setIsInitialChoiceMade] = useState<boolean>(true);

  // 1. Isolated Demo State for optional guidance
  const [demoData, setDemoData] = useState<DemoScenariosPackage>(() => {
    try {
      const saved = localStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load demo data from storage:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DEMO_SCENARIOS));
  });

  // 2. Real User Data State (scoped strictly to current userId)
  const [userData, setUserData] = useState<RealUserData>(() => {
    try {
      const userKey = `civicai_user_${userId}`;
      const saved = localStorage.getItem(userKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load user data from storage:', e);
    }
    return INITIAL_USER_DATA(userId);
  });

  // 3. User Activities State (strictly isolated per userId)
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const actKey = `civicai_activities_${userId}`;
      const saved = localStorage.getItem(actKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Persist demo state
  useEffect(() => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoData));
    } catch (e) {
      console.warn('Failed to persist demo data:', e);
    }
  }, [demoData]);

  // Load activities from Supabase backend for current userId
  useEffect(() => {
    let cancelled = false;
    fetchUserActivitiesFromSupabase(userId).then(remoteActs => {
      if (cancelled || !Array.isArray(remoteActs) || remoteActs.length === 0) return;
      const formatted: ActivityItem[] = remoteActs.map(r => ({
        id: r.id || `act_${Date.now()}_${Math.random()}`,
        type: r.payload?.title || r.activity_type,
        activityType: r.activity_type as any,
        title: r.payload?.title || 'User Activity',
        date: r.created_at ? new Date(r.created_at).toLocaleString() : new Date().toLocaleString(),
        tab: r.payload?.tab || 'rti',
        icon: r.payload?.icon || '📝',
        payload: r.payload
      }));
      setActivities(prev => {
        const merged = [...formatted];
        prev.forEach(p => {
          if (!merged.some(m => m.id === p.id)) merged.push(p);
        });
        return merged;
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  // Persist activities locally per userId
  useEffect(() => {
    try {
      const actKey = `civicai_activities_${userId}`;
      localStorage.setItem(actKey, JSON.stringify(activities));
    } catch (e) {}
  }, [activities, userId]);

  // Restore user profile from Supabase
  useEffect(() => {
    let cancelled = false;
    fetchUserDataFromSupabase(userId).then(remote => {
      if (cancelled || !remote) return;
      setUserData(prev => ({ ...prev, ...remote, id: userId, type: 'user' }));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  // Persist user state to localStorage and Supabase
  useEffect(() => {
    try {
      const userKey = `civicai_user_${userId}`;
      localStorage.setItem(userKey, JSON.stringify(userData));
      saveUserDataToSupabase(userId, userData).catch(() => {});
    } catch (e) {
      console.warn('Failed to persist user data locally:', e);
    }
  }, [userData, userId]);

  const syncWithBackend = useCallback(async () => {
    try {
      await saveUserDataToSupabase(userId, userData);
      fetch('/api/user/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(userData)
      }).catch(() => {});
    } catch (e) {}
  }, [userData, userId]);

  const setUserId = useCallback((newId: string) => {
    const trimmed = newId.trim();
    if (!trimmed) return;
    setUserIdState(trimmed);
    localStorage.setItem(ACTIVE_USER_ID_KEY, trimmed);

    try {
      const userKey = `civicai_user_${trimmed}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        setUserData(JSON.parse(saved));
      } else {
        setUserData(INITIAL_USER_DATA(trimmed));
      }

      const actKey = `civicai_activities_${trimmed}`;
      const savedActs = localStorage.getItem(actKey);
      if (savedActs) {
        setActivities(JSON.parse(savedActs));
      } else {
        setActivities([]);
      }
    } catch (e) {
      setUserData(INITIAL_USER_DATA(trimmed));
      setActivities([]);
    }
  }, []);

  const setDataMode = useCallback((mode: DataMode) => {
    setDataModeState(mode);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch (e) {}
  }, []);

  const chooseMode = useCallback((mode: DataMode) => {
    setDataModeState(mode);
    setIsInitialChoiceMade(true);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
      localStorage.setItem('civicai_choice_made', 'true');
    } catch (e) {}
  }, []);

  const updateUserData = useCallback(<K extends keyof RealUserData>(
    section: K, 
    data: Partial<RealUserData[K]> | ((prev: RealUserData[K]) => RealUserData[K])
  ) => {
    setUserData(prev => {
      let updatedSection: RealUserData[K];
      if (typeof data === 'function') {
        updatedSection = (data as (prev: RealUserData[K]) => RealUserData[K])(prev[section]);
      } else if (typeof prev[section] === 'object' && prev[section] !== null && !Array.isArray(prev[section])) {
        updatedSection = { ...prev[section], ...(data as object) };
      } else {
        updatedSection = data as RealUserData[K];
      }

      const next = {
        ...prev,
        [section]: updatedSection,
        lastUpdated: new Date().toISOString()
      };

      return next;
    });
  }, []);

  const updateDemoData = useCallback(<K extends keyof DemoScenariosPackage>(
    section: K, 
    data: Partial<DemoScenariosPackage[K]> | ((prev: DemoScenariosPackage[K]) => DemoScenariosPackage[K])
  ) => {
    setDemoData(prev => {
      let updatedSection: DemoScenariosPackage[K];
      if (typeof data === 'function') {
        updatedSection = (data as (prev: DemoScenariosPackage[K]) => DemoScenariosPackage[K])(prev[section]);
      } else {
        updatedSection = { ...prev[section], ...(data as object) };
      }
      return {
        ...prev,
        [section]: updatedSection
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = JSON.parse(JSON.stringify(INITIAL_DEMO_SCENARIOS));
    setDemoData(fresh);
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh));
    } catch (e) {}
  }, []);

  const recordActivity = useCallback(async (
    activityType: ActivityItem['activityType'],
    title: string,
    tab: string,
    icon: string,
    payload?: any
  ) => {
    const newItem: ActivityItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: title,
      activityType,
      title,
      date: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      tab,
      icon,
      payload
    };

    setActivities(prev => [newItem, ...prev.filter(p => p.title !== title)]);
    saveUserActivityToSupabase(userId, activityType, { title, tab, icon, payload }).catch(() => {});
  }, [userId]);

  const clearActivities = useCallback(() => {
    setActivities([]);
    try {
      localStorage.removeItem(`civicai_activities_${userId}`);
    } catch (e) {}
  }, [userId]);

  const clearUserData = useCallback(async () => {
    const empty = INITIAL_USER_DATA(userId);
    setUserData(empty);
    setActivities([]);
    try {
      const userKey = `civicai_user_${userId}`;
      localStorage.removeItem(userKey);
      localStorage.setItem(userKey, JSON.stringify(empty));
      localStorage.removeItem(`civicai_activities_${userId}`);
      
      await fetch('/api/user/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Failed to clear user data:', e);
    }
  }, [userId]);

  return (
    <UserContext.Provider
      value={{
        userId,
        dataMode,
        isInitialChoiceMade,
        demoData,
        userData,
        activities,
        setUserId,
        setDataMode,
        chooseMode,
        updateUserData,
        updateDemoData,
        resetDemo,
        clearUserData,
        syncWithBackend,
        recordActivity,
        clearActivities
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useUserData() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserProvider');
  }
  return context;
}
