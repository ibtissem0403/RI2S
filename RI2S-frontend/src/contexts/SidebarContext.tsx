// contexts/SidebarContext.tsx
'use client';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface SidebarContextType {
  expanded: boolean;
  pinned: boolean;
  togglePin: () => void;
  expand: () => void;
  collapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [expanded, setExpanded] = useState(true);
  const [pinned, setPinned] = useState(false);

  // Lorsque pinned change, s'assurer que le sidebar est étendu si épinglé
  useEffect(() => {
    if (pinned) {
      setExpanded(true);
    }
  }, [pinned]);

  // Fonctions pour manipuler l'état
  const togglePin = () => setPinned(!pinned);
  const expand = () => !pinned && setExpanded(true);
  const collapse = () => !pinned && setExpanded(false);

  return (
    <SidebarContext.Provider value={{ expanded, pinned, togglePin, expand, collapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}