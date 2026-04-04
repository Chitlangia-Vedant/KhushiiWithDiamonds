import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DiamondQuality } from '../constants/jewellery';

interface QualityContextType {
  globalGoldPurity: string;
  setGlobalGoldPurity: (purity: string) => void;
  globalDiamondQuality: DiamondQuality;
  setGlobalDiamondQuality: (quality: DiamondQuality) => void;
}

const QualityContext = createContext<QualityContextType | undefined>(undefined);

export function QualityProvider({ children }: { children: ReactNode }) {
  // Set your default fallback values here
  const [globalGoldPurity, setGlobalGoldPurity] = useState('18K');
  const [globalDiamondQuality, setGlobalDiamondQuality] = useState<DiamondQuality>('EF/VVS');

  return (
    <QualityContext.Provider value={{
      globalGoldPurity,
      setGlobalGoldPurity,
      globalDiamondQuality,
      setGlobalDiamondQuality
    }}>
      {children}
    </QualityContext.Provider>
  );
}

// The custom hook that lets any file instantly access or change the global quality!
export const useQualityContext = () => {
  const context = useContext(QualityContext);
  if (context === undefined) {
    throw new Error('useQualityContext must be used within a QualityProvider');
  }
  return context;
};