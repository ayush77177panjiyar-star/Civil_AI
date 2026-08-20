import React from 'react';
import { useUserData } from '../context/UserContext';
import { Language } from '../types';

interface InitialChoiceModalProps {
  language: Language;
}

export const InitialChoiceModal: React.FC<InitialChoiceModalProps> = () => {
  // Requirement 1 & 16: CivicAI always starts with a clean, empty user interface.
  return null;
};
