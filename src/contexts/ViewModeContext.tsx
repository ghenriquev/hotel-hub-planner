import { createContext, useContext, useState, ReactNode } from 'react';

interface ViewModeContextType {
  isViewingAsUser: boolean;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [isViewingAsUser, setIsViewingAsUser] = useState(false);
  
  const toggleViewMode = () => setIsViewingAsUser(prev => !prev);
  
  return (
    <ViewModeContext.Provider value={{ isViewingAsUser, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
