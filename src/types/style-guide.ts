// Style Guide Configuration
export interface StyleGuideConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  activeColorScheme: string;
  activeTypography: string;
  activeSpacing: string;
  activeBorderRadius: string;
  activeShadow: string;
  activeAnimation: string;
  customFeatures: {
    customCursor?: boolean;
    customScrollbar?: boolean;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Color Scheme
export interface ColorScheme {
  id: string;
  name: string;
  version: number;
  // Basic colors
  primary: string;
  secondary: string;
  accent: string;
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;
  // UI colors
  background: string;
  surface: string;
  text: string;
  // Optional nested color objects for more complex schemes
  colors?: {
    primary?: Record<string, string>;
    secondary?: Record<string, string>;
    accent?: Record<string, string>;
    success?: Record<string, string>;
    warning?: Record<string, string>;
    error?: Record<string, string>;
    info?: Record<string, string>;
  };
  // Grayscale palette
  grayscale?: Record<string, string>;
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Typography
export interface Typography {
  id: string;
  name: string;
  version: number;
  fontFamily: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    [key: string]: string;
  };
  fontWeight: {
    thin: number;
    extralight: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
    [key: string]: number;
  };
  lineHeight: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
    [key: string]: number;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
    [key: string]: string;
  };
  // Optional additional typography settings
  headings?: {
    fontFamily?: string;
    fontWeight?: number;
    lineHeight?: number;
    letterSpacing?: string;
  };
  body?: {
    fontFamily?: string;
    fontWeight?: number;
    lineHeight?: number;
    letterSpacing?: string;
  };
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Component
export interface Component {
  id: string;
  name: string;
  type: string;
  description: string;
  version: number;
  props: Record<string, any>;
  styles: Record<string, any>;
  states: {
    default: Record<string, any>;
    hover?: Record<string, any>;
    focus?: Record<string, any>;
    active?: Record<string, any>;
    disabled?: Record<string, any>;
    [key: string]: Record<string, any> | undefined;
  };
  variants?: Record<string, {
    styles: Record<string, any>;
    states?: {
      default: Record<string, any>;
      hover?: Record<string, any>;
      focus?: Record<string, any>;
      active?: Record<string, any>;
      disabled?: Record<string, any>;
      [key: string]: Record<string, any> | undefined;
    };
  }>;
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Spacing
export interface Spacing {
  id: string;
  name: string;
  version: number;
  scale: {
    '0': string;
    '1': string;
    '2': string;
    '3': string;
    '4': string;
    '5': string;
    '6': string;
    '8': string;
    '10': string;
    '12': string;
    '16': string;
    '20': string;
    '24': string;
    '32': string;
    '40': string;
    '48': string;
    '56': string;
    '64': string;
    '80': string;
    '96': string;
    [key: string]: string;
  };
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Version History
export interface VersionHistory {
  id: string;
  styleGuideId: string;
  version: string;
  changes: string;
  snapshot: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

// Image
export interface Image {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  category?: string;
  tags?: string[];
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Feedback
export interface Feedback {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'improvement' | 'question';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  comments?: FeedbackComment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Feedback Comment
export interface FeedbackComment {
  id: string;
  feedbackId: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

// Border Radius
export interface BorderRadius {
  id: string;
  name: string;
  version: number;
  scale: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
    [key: string]: string;
  };
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Shadow
export interface Shadow {
  id: string;
  name: string;
  version: number;
  scale: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    [key: string]: string;
  };
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Animation
export interface Animation {
  id: string;
  name: string;
  version: number;
  transitions: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
      [key: string]: string;
    };
    easing: {
      linear: string;
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
      [key: string]: string;
    };
  };
  keyframes?: Record<string, string>;
  animations?: Record<string, {
    name: string;
    duration: string;
    timingFunction: string;
    delay?: string;
    iterationCount?: string;
    direction?: string;
    fillMode?: string;
    playState?: string;
  }>;
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Design Token Export Format
export interface DesignTokenExport {
  id: string;
  name: string;
  format: 'css' | 'scss' | 'json' | 'js' | 'ts';
  content: string;
  colorSchemeId?: string;
  typographyId?: string;
  spacingId?: string;
  borderRadiusId?: string;
  shadowId?: string;
  animationId?: string;
  createdAt: string;
  updatedBy: string;
}
