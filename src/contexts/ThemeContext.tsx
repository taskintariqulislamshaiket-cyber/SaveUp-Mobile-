import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = theme === 'dark' 
    ? {
        // ✅ DARK MODE - Like Image 2
        background: '#0f172a',      // Dark navy (was #004D00 bright green ❌)
        surface: '#1e293b',         // Slightly lighter navy
        primary: '#00D4A1',         // Teal accent
        text: '#ffffff',            // White text
        textSecondary: '#94a3b8',   // Light gray text
        border: '#334155',          // Dark gray border
      }
    : {
        // ✅ LIGHT MODE - Like Image 3
        background: '#E0F7F1',      // Light mint
        surface: '#ffffff',         // White cards
        primary: '#00D4A1',         // Teal accent
        text: '#004D00',            // Dark green text
        textSecondary: '#005864',   // Dark teal text
        border: '#8BD3C7',          // Light teal border
      };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
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
