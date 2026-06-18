'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AppContextType {
  user: any;
  themeMode: 'light' | 'dark';
  language: string;
  login: (token: string, userData: any) => void;
  logout: () => void;
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguageState] = useState<string>('en');
  const router = useRouter();

  useEffect(() => {
    // Rehydrate state from localStorage safely on client
    const storedUser = localStorage.getItem('user');
    const storedTheme = localStorage.getItem('themeMode');
    const storedLang = localStorage.getItem('language');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedTheme === 'dark' || storedTheme === 'light') setThemeMode(storedTheme);
    if (storedLang) setLanguageState(storedLang);
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:3000/api/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout request failed', e);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem('themeMode', newTheme);
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <AppContext.Provider value={{ user, themeMode, language, login, logout, toggleTheme, setLanguage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
