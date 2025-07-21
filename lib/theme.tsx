import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryText: string;
  border: string;
  header: string;
  headerText: string;
  icon: string;
  success: string;
  warning: string;
  error: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  buttonBackground: string;
  buttonText: string;
  modalBackground: string;
  shadowColor: string;
}

const lightTheme: ThemeColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  card: '#ffffff',
  text: '#212529',
  textSecondary: '#495057',
  primary: '#2f9e44',
  primaryText: '#ffffff',
  border: '#e9ecef',
  header: '#f8f9fa',
  headerText: '#212529',
  icon: '#2f9e44',
  success: '#8ce99a',
  warning: '#ffec99',
  error: '#ff8787',
  tabBarBackground: '#262A2B',
  tabBarActive: '#BCAB92',
  tabBarInactive: '#8B8776',
  inputBackground: '#ffffff',
  inputBorder: '#e0e0e0',
  inputText: '#333333',
  buttonBackground: '#2f9e44',
  buttonText: '#ffffff',
  modalBackground: 'rgba(0, 0, 0, 0.5)',
  shadowColor: '#000000',
};

const darkTheme: ThemeColors = {
  background: '#1a1a1a',
  surface: '#2d2d2d',
  card: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  primary: '#4ade80',
  primaryText: '#000000',
  border: '#404040',
  header: '#2d2d2d',
  headerText: '#ffffff',
  icon: '#4ade80',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  tabBarBackground: '#1a1a1a',
  tabBarActive: '#4ade80',
  tabBarInactive: '#666666',
  inputBackground: '#404040',
  inputBorder: '#555555',
  inputText: '#ffffff',
  buttonBackground: '#4ade80',
  buttonText: '#000000',
  modalBackground: 'rgba(0, 0, 0, 0.8)',
  shadowColor: '#000000',
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: lightTheme,
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  // Load theme from storage on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
