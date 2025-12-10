"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import "./globals.css";
import type { Theme, View } from '@/types/common';
import type { UIContextType, LayoutProps } from '@/types/ui';

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within UIContext.Provider");
  }
  return context;
};

export default function RootLayout({ children }: LayoutProps): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>("light");
  const [view, setView] = useState<View>("mobile");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    } else {
      // Detect system preference if no saved theme
      if (typeof window !== "undefined") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    }
    
    // Detect viewport
    const updateView = (): void => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      if (w >= 1024) setView("desktop");
      else if (w >= 768) setView("tablet");
      else setView("mobile");
    };
    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, []);

  const cycleTheme = (): void => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  const cycleView = (): void => {
    setView((prev) => {
      const views: View[] = ["mobile", "tablet", "desktop"];
      const currentIndex = views.indexOf(prev);
      const nextIndex = (currentIndex + 1) % views.length;
      return views[nextIndex];
    });
  };

  const themeIcon = theme === "light" ? "☀️" : "🌙";
  const viewIcon = view === "mobile" ? "📱" : view === "tablet" ? "📱" : "🖥️";

  return (
    <html lang="mn" data-scroll-behavior="smooth">
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

