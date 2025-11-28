import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

interface SafeModeContextType {
  isSafeMode: boolean;
  toggleSafeMode: () => void;
}

const SafeModeContext = createContext<SafeModeContextType | undefined>(undefined);

export const SafeModeProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [isSafeMode, setIsSafeMode] = useState(true);

  const toggleSafeMode = () => {
    // If turning off safe mode, maybe ask for confirmation?
    if (isSafeMode) {
        if (confirm("⚠️ ENABLING GOD MODE ⚠️\nDestructive actions will happen instantly without confirmation.\nAre you sure?")) {
            setIsSafeMode(false);
        }
    } else {
        setIsSafeMode(true);
    }
  };

  return (
    <SafeModeContext.Provider value={{ isSafeMode, toggleSafeMode }}>
      {children}
    </SafeModeContext.Provider>
  );
};

export const useSafeMode = () => {
  const context = useContext(SafeModeContext);
  if (!context) throw new Error('useSafeMode must be used within SafeModeProvider');
  return context;
};