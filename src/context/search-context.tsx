
'use client';

import React, { createContext, useState, type ReactNode } from 'react';

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
};
