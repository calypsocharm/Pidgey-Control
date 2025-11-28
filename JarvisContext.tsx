
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

export type PidgeyMood = 'idle' | 'thinking' | 'happy' | 'alert';

interface DraftPayload {
    type: 'DRAFT_DROP' | 'DRAFT_STAMP' | 'DRAFT_PROMO';
    data: any;
}

interface PidgeyContextType {
  isOpen: boolean;
  mood: PidgeyMood;
  initialMessage: string;
  openPidgey: (message?: string) => void;
  closePidgey: () => void;
  setMood: (mood: PidgeyMood) => void;
  clearMessage: () => void;
  
  // Drafting / Actions
  draftPayload: DraftPayload | null;
  setDraftPayload: (payload: DraftPayload | null) => void;

  // Memory / Learning
  memories: string[];
  learn: (fact: string) => void;
}

const PidgeyContext = createContext<PidgeyContextType | undefined>(undefined);

export const JarvisProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [mood, setMood] = useState<PidgeyMood>('idle');
  const [draftPayload, setDraftPayload] = useState<DraftPayload | null>(null);
  const [memories, setMemories] = useState<string[]>([]);

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

  const learn = (fact: string) => {
    if (!memories.includes(fact)) {
        setMemories(prev => [...prev, fact]);
    }
  };

  return (
    <PidgeyContext.Provider value={{ 
        isOpen, mood, setMood, initialMessage, openPidgey, closePidgey, clearMessage,
        draftPayload, setDraftPayload,
        memories, learn
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
