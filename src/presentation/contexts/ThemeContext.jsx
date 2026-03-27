/**
 * ThemeContext - контекст темы оформления
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEMES = {
  light: {
    name: 'Светлая',
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    panel: 'bg-white',
  },
  dark: {
    name: 'Тёмная',
    bg: 'bg-zinc-900',
    text: 'text-zinc-100',
    panel: 'bg-zinc-800',
  },
  highContrast: {
    name: 'Высокий контраст',
    bg: 'bg-black',
    text: 'text-yellow-400',
    panel: 'bg-zinc-900',
  },
};

/**
 * Провайдер контекста темы
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('ecros_theme');
    if (saved && THEMES[saved]) {
      setTheme(saved);
    }
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('ecros_theme', newTheme);
  };

  const toggleTheme = () => {
    const themes = Object.keys(THEMES);
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    changeTheme(themes[nextIndex]);
  };

  const value = {
    theme,
    themeConfig: THEMES[theme],
    themes: THEMES,
    changeTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Хук для использования контекста темы
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}
