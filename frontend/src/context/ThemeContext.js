import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  const theme = {
    isDark,
    colors: isDark ? {
      background: '#121212',
      text: '#ffffff',
      primary: '#bb86fc',
      card: '#1e1e1e',
      border: '#333333',
    } : {
      background: '#f5f5f5',
      text: '#000000',
      primary: '#007bff',
      card: '#ffffff',
      border: '#dddddd',
    },
  };

  return (
    <ThemeContext.Provider value={{ ...theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};