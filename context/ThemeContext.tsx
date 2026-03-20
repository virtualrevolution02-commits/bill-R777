import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  isDark: boolean;
  colors: {
    background: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>("dark");

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("user-theme");
      if (savedTheme) {
        setTheme(savedTheme as ThemeType);
      } else {
        setTheme("dark"); // Default to dark as per existing app style
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await AsyncStorage.setItem("user-theme", newTheme);
  };

  const isDark = theme === "dark";

  const colors = {
    background: isDark ? "#0F0F0F" : "#F2F2F7", // Softer light cream-white
    card: isDark ? "#1E1E1E" : "#F9F9F9",       // Subtle card separation
    text: isDark ? "#FFFFFF" : "#1C1C1E",       // Standard Apple-style dark text
    subtext: isDark ? "#A0A0A0" : "#8E8E93",
    border: isDark ? "#2C2C2C" : "#D1D1D6",
    primary: "#E53935", // Brand red
    secondary: isDark ? "#FFC107" : "#F57C00", // Adjusted for better visibility on white
    accent: isDark ? "#333333" : "#E5E5EA",     // Softer light accents
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
