"use client";

import { createContext, useContext, useState } from "react";
import "./globals.css";

const UIContext = createContext();
export const useUI = () => useContext(UIContext);

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("light");
  const [view, setView] = useState("mobile");

  const cycleTheme = () => {
    const next = theme === "light" ? "mid" : theme === "mid" ? "night" : "light";
    setTheme(next);
  };

  const cycleView = () => {
    const next = view === "mobile" ? "tablet" : view === "tablet" ? "desktop" : "mobile";
    setView(next);
  };

  // Simple ASCII badges to show the current theme / viewport target
  const themeIcon = theme === "light" ? "SUN" : theme === "mid" ? "MID" : "MOON";
  const viewIcon = view === "mobile" ? "MOB" : view === "tablet" ? "TAB" : "DESK";

  return (
    <html lang="en">
      <body className="relative">
        <UIContext.Provider value={{ theme, view, cycleTheme, cycleView }}>
          {/* TOP-RIGHT CONTROL ICONS */}
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <button
              onClick={cycleView}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-300 shadow"
            >
              {viewIcon}
            </button>

            <button
              onClick={cycleTheme}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-300 shadow"
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
