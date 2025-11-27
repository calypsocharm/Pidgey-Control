import React, { createContext, useContext, useState, ReactNode, PropsWithChildren } from 'react';

interface JarvisContextType {
  isOpen: boolean;
  initialMessage: string;
  openJarvis: (message?: string) => void;
  closeJarvis: () => void;
  clearMessage: () => void;
}

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

export const JarvisProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  const openJarvis = (message: string = '') => {
    if (message) setInitialMessage(message);
    setIsOpen(true);
  };

  const closeJarvis = () => {
    setIsOpen(false);
  };

  const clearMessage = () => {
    setInitialMessage('');
  };

  return (
    <JarvisContext.Provider value={{ isOpen, initialMessage, openJarvis, closeJarvis, clearMessage }}>
      {children}
    </JarvisContext.Provider>
  );
};

export const useJarvis = () => {
  const context = useContext(JarvisContext);
  if (!context) throw new Error('useJarvis must be used within a JarvisProvider');
  return context;
};