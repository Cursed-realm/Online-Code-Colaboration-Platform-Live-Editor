import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Theme definitions
const themes = {
  dark: {
    name: 'Dark',
    isDark: true,
    primary: '#6366f1',
    secondary: '#e879f9',
    bg: '#0f172a',
    bgSecondary: '#1e293b',
    text: '#f1f5f9',
  },
  light: {
    name: 'Light',
    isDark: false,
    primary: '#6366f1',
    secondary: '#e879f9',
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    text: '#0f172a',
  },
  midnight: {
    name: 'Midnight',
    isDark: true,
    primary: '#7c3aed',
    secondary: '#a78bfa',
    bg: '#0f172a',
    bgSecondary: '#1e1b4b',
    text: '#f1f5f9',
  },
  ocean: {
    name: 'Ocean',
    isDark: true,
    primary: '#06b6d4',
    secondary: '#0891b2',
    bg: '#082f49',
    bgSecondary: '#0c4a6e',
    text: '#e0f2fe',
  },
  forest: {
    name: 'Forest',
    isDark: true,
    primary: '#10b981',
    secondary: '#34d399',
    bg: '#064e3b',
    bgSecondary: '#047857',
    text: '#d1fae5',
  },
  sunset: {
    name: 'Sunset',
    isDark: true,
    primary: '#f97316',
    secondary: '#fb923c',
    bg: '#431407',
    bgSecondary: '#7c2d12',
    text: '#fef3c7',
  },
  cyberpunk: {
    name: 'Cyberpunk',
    isDark: true,
    primary: '#ec4899',
    secondary: '#06b6d4',
    bg: '#0d0221',
    bgSecondary: '#0f3460',
    text: '#eaeaea',
  },
  minimalist: {
    name: 'Minimalist',
    isDark: false,
    primary: '#374151',
    secondary: '#6b7280',
    bg: '#ffffff',
    bgSecondary: '#f9fafb',
    text: '#1f2937',
  },
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('selectedTheme');
    return saved && themes[saved] ? saved : 'dark';
  });

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    const body = document.body;
    
    // Apply theme variables
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--bg-dark', theme.bg);
    root.style.setProperty('--bg-dark-secondary', theme.bgSecondary);
    root.style.setProperty('--text-dark', theme.text);
    
    if (theme.isDark) {
      root.style.colorScheme = 'dark';
      body.classList.add('dark-mode');
    } else {
      root.style.colorScheme = 'light';
      body.classList.remove('dark-mode');
    }
    
    localStorage.setItem('selectedTheme', currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => {
    const themeKeys = Object.keys(themes);
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setCurrentTheme(themeKeys[nextIndex]);
  };

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themes, toggleTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
