'use client';

import { create } from 'zustand';
import {
  ColorScheme,
  Typography,
  Component,
  Spacing,
  BorderRadius,
  Shadow,
  Animation,
  StyleGuideConfig,
  DesignTokenExport
} from '@/types/style-guide';

interface StyleGuideState {
  // Global UI state
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isRealTimeEnabled: boolean;
  toggleRealTime: () => void;

  // Loading and error states
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Style guide configuration
  config: StyleGuideConfig | null;
  setConfig: (config: StyleGuideConfig | null) => void;

  // Color schemes
  colorSchemes: ColorScheme[];
  setColorSchemes: (colorSchemes: ColorScheme[]) => void;
  activeColorScheme: ColorScheme | null;
  setActiveColorScheme: (colorScheme: ColorScheme | null) => void;

  // Typography
  typographies: Typography[];
  setTypographies: (typographies: Typography[]) => void;
  activeTypography: Typography | null;
  setActiveTypography: (typography: Typography | null) => void;

  // Components
  components: Component[];
  setComponents: (components: Component[]) => void;
  addComponent: (component: Component) => void;
  updateComponent: (component: Component) => void;
  removeComponent: (id: string) => void;

  // Spacing
  spacings: Spacing[];
  setSpacings: (spacings: Spacing[]) => void;
  activeSpacing: Spacing | null;
  setActiveSpacing: (spacing: Spacing | null) => void;

  // Border Radius
  borderRadiuses: BorderRadius[];
  setBorderRadiuses: (borderRadiuses: BorderRadius[]) => void;
  activeBorderRadius: BorderRadius | null;
  setActiveBorderRadius: (borderRadius: BorderRadius | null) => void;

  // Shadow
  shadows: Shadow[];
  setShadows: (shadows: Shadow[]) => void;
  activeShadow: Shadow | null;
  setActiveShadow: (shadow: Shadow | null) => void;

  // Animation
  animations: Animation[];
  setAnimations: (animations: Animation[]) => void;
  activeAnimation: Animation | null;
  setActiveAnimation: (animation: Animation | null) => void;

  // Design Token Exports
  designTokenExports: DesignTokenExport[];
  setDesignTokenExports: (exports: DesignTokenExport[]) => void;
  addDesignTokenExport: (exportData: DesignTokenExport) => void;
  removeDesignTokenExport: (id: string) => void;
}

export const useStyleGuideStore = create<StyleGuideState>((set) => ({
  // Global UI state
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  isRealTimeEnabled: true,
  toggleRealTime: () => set((state) => ({ isRealTimeEnabled: !state.isRealTimeEnabled })),

  // Loading and error states
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),

  // Style guide configuration
  config: null,
  setConfig: (config) => set({ config }),

  // Color schemes
  colorSchemes: [],
  setColorSchemes: (colorSchemes) => set({ colorSchemes }),
  activeColorScheme: null,
  setActiveColorScheme: (activeColorScheme) => set({ activeColorScheme }),

  // Typography
  typographies: [],
  setTypographies: (typographies) => set({ typographies }),
  activeTypography: null,
  setActiveTypography: (activeTypography) => set({ activeTypography }),

  // Components
  components: [],
  setComponents: (components) => set({ components }),
  addComponent: (component) => set((state) => ({
    components: [...state.components, component]
  })),
  updateComponent: (component) => set((state) => ({
    components: state.components.map(c => c.id === component.id ? component : c)
  })),
  removeComponent: (id) => set((state) => ({
    components: state.components.filter(c => c.id !== id)
  })),

  // Spacing
  spacings: [],
  setSpacings: (spacings) => set({ spacings }),
  activeSpacing: null,
  setActiveSpacing: (activeSpacing) => set({ activeSpacing }),

  // Border Radius
  borderRadiuses: [],
  setBorderRadiuses: (borderRadiuses) => set({ borderRadiuses }),
  activeBorderRadius: null,
  setActiveBorderRadius: (activeBorderRadius) => set({ activeBorderRadius }),

  // Shadow
  shadows: [],
  setShadows: (shadows) => set({ shadows }),
  activeShadow: null,
  setActiveShadow: (activeShadow) => set({ activeShadow }),

  // Animation
  animations: [],
  setAnimations: (animations) => set({ animations }),
  activeAnimation: null,
  setActiveAnimation: (activeAnimation) => set({ activeAnimation }),

  // Design Token Exports
  designTokenExports: [],
  setDesignTokenExports: (designTokenExports) => set({ designTokenExports }),
  addDesignTokenExport: (exportData) => set((state) => ({
    designTokenExports: [...state.designTokenExports, exportData]
  })),
  removeDesignTokenExport: (id) => set((state) => ({
    designTokenExports: state.designTokenExports.filter(e => e.id !== id)
  })),
}));
