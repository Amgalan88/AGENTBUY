import type { Theme, View } from './common';

export interface UIContextType {
  theme: Theme;
  view: View;
  cycleTheme: () => void;
  cycleView: () => void;
}

export interface LayoutProps {
  children: React.ReactNode;
}

