import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  getPrimaryColor: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Светлые оттенки
const LIGHT_COLORS = [
  { name: 'Голубой', value: '#60A5FA' },
  { name: 'Лаванда', value: '#A78BFA' },
  { name: 'Розовый', value: '#F472B6' },
  { name: 'Коралловый', value: '#F87171' },
  { name: 'Персиковый', value: '#FB923C' },
  { name: 'Мятный', value: '#34D399' },
  { name: 'Аква', value: '#22D3EE' },
  { name: 'Индиго', value: '#818CF8' },
];

// Тёмные оттенки (более насыщенные для тёмной темы)
const DARK_COLORS = [
  { name: 'Голубой', value: '#3B82F6' },
  { name: 'Лаванда', value: '#8B5CF6' },
  { name: 'Розовый', value: '#EC4899' },
  { name: 'Коралловый', value: '#EF4444' },
  { name: 'Персиковый', value: '#F97316' },
  { name: 'Мятный', value: '#10B981' },
  { name: 'Аква', value: '#06B6D4' },
  { name: 'Индиго', value: '#6366F1' },
];

export const PRIMARY_COLORS = LIGHT_COLORS;

// Функция для затемнения цвета
function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
  const b = Math.max(0, (num & 0x0000FF) - amount);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return (saved as Theme) || 'light';
    }
    return 'light';
  });

  const [primaryColor, setPrimaryColorState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('primaryColor') || '#60A5FA';
    }
    return '#60A5FA';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
    // Применяем цвет с учётом темы
    const effectiveColor = theme === 'dark' ? darkenColor(primaryColor, 30) : primaryColor;
    document.documentElement.style.setProperty('--color-primary', effectiveColor);
  }, [primaryColor, theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
  };

  const getPrimaryColor = (): string => {
    return theme === 'dark' ? darkenColor(primaryColor, 30) : primaryColor;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, primaryColor, setPrimaryColor, getPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
