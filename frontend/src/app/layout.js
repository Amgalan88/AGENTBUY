"use client";

import { createContext, useContext, useState, useEffect } from "react";
import "./globals.css";

const UIContext = createContext();
export const useUI = () => useContext(UIContext);

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("light");
  const [view, setView] = useState("mobile");

  // Detect system preference on mount
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
    
    // Detect viewport
    const updateView = () => {
      const w = window.innerWidth;
      if (w >= 1024) setView("desktop");
      else if (w >= 768) setView("tablet");
      else setView("mobile");
    };
    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, []);

  const cycleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const cycleView = () => {
    const next = view === "mobile" ? "tablet" : view === "tablet" ? "desktop" : "mobile";
    setView(next);
  };

  const themeIcon = theme === "light" ? "☀️" : "🌙";
  const viewIcon = view === "mobile" ? "📱" : view === "tablet" ? "📱" : "🖥️";

  return (
    <html lang="mn">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`relative ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
        <UIContext.Provider value={{ theme, view, cycleTheme, cycleView }}>
          {/* Floating Controls */}
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <button
              onClick={cycleView}
              className="icon-btn"
              aria-label="Toggle view"
            >
              {viewIcon}
            </button>
            <button
              onClick={cycleTheme}
              className="icon-btn"
              aria-label="Toggle theme"
            >
              {themeIcon}
            </button>
          </div>

          {children}
        </UIContext.Provider>
      </body>
    </html>
  );
}
