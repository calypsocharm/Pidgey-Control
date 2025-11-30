import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { CreationDraft } from './types';

export type PidgeyMood = 'idle' | 'thinking' | 'happy' | 'alert';

interface PidgeyContextType {
  isOpen: boolean;
  mood: PidgeyMood;
  initialMessage: string;
  openPidgey: (message?: string) => void;
  closePidgey: () => void;
  setMood: (mood: PidgeyMood) => void;
  clearMessage: () => void;
  
  // Creations / Drafts Repository
  creations: CreationDraft[];
  addCreation: (draft: CreationDraft) => void;
  removeCreation: (id: string) => void;

  // Memory / Learning
  memories: string[];
  learn: (fact: string) => void;

  // Ephemeral Draft Payload for page-to-page interactions
  draftPayload: { type: string; data: any } | null;
  setDraftPayload: (payload: { type: string; data: any } | null) => void;
}

const PidgeyContext = createContext<PidgeyContextType | undefined>(undefined);

export const JarvisProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [mood, setMood] = useState<PidgeyMood>('idle');
  const [memories, setMemories] = useState<string[]>([]);
  
  // Centralized Draft Repository
  const [creations, setCreations] = useState<CreationDraft[]>([]);

  // Ephemeral payload for inter-component communication
  const [draftPayload, setDraftPayload] = useState<{ type: string; data: any } | null>(null);

  const openPidgey = (message: string = '') => {
    if (message) setInitialMessage(message);
    setIsOpen(true);
    setMood('happy');
    // Reset mood after a moment
    setTimeout(() => setMood('idle'), 2000);
  };

  const closePidgey = () => {
    setIsOpen(false);
    setMood('idle');
  };

  const clearMessage = () => {
    setInitialMessage('');
  };

  const addCreation = (draft: CreationDraft) => {
      setCreations(prev => [draft, ...prev]);
  };

  const removeCreation = (id: string) => {
      setCreations(prev => prev.filter(c => c.id !== id));
  };

  const learn = (fact: string) => {
    if (!memories.includes(fact)) {
        setMemories(prev => [...prev, fact]);
    }
  };

  return (
    <PidgeyContext.Provider value={{ 
        isOpen, mood, setMood, initialMessage, openPidgey, closePidgey, clearMessage,
        creations, addCreation, removeCreation,
        memories, learn,
        draftPayload, setDraftPayload
    }}>
      {children}
    </PidgeyContext.Provider>
  );
};

export const useJarvis = () => {
  const context = useContext(PidgeyContext);
  if (!context) throw new Error('usePidgey must be used within a PidgeyProvider');
  return context;
};