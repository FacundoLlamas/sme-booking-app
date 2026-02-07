/**
 * Design System - Chat Widget Theme and Design Tokens
 * Centralized theme configuration for consistent styling across components
 */

export const DESIGN_TOKENS = {
  // Color Palette
  colors: {
    // Primary: Sky Blue (from Tailwind theme)
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main primary
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },

    // Neutral/Gray Scale
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },

    // Semantic Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Spacing - 4px base unit
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },

  // Typography
  typography: {
    // Font families
    fontFamily: {
      sans: 'system-ui, -apple-system, sans-serif',
      mono: 'Menlo, Monaco, Consolas, "Courier New", monospace',
    },

    // Font sizes (with line heights)
    fontSize: {
      xs: { size: '12px', lineHeight: '16px' },
      sm: { size: '14px', lineHeight: '20px' },
      base: { size: '16px', lineHeight: '24px' },
      lg: { size: '18px', lineHeight: '28px' },
      xl: { size: '20px', lineHeight: '28px' },
    },

    // Font weights
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Animations & Transitions
  animation: {
    // Duration (ms)
    duration: {
      fast: 100,
      normal: 200,
      slow: 300,
      slower: 500,
    },

    // Easing
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    full: '999px',
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    modal: 1050,
    tooltip: 1070,
  },
} as const;

/**
 * Theme - Dark and Light modes
 */
export const THEME = {
  light: {
    bg: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },
    border: '#e5e7eb',
    hover: '#f3f4f6',
  },

  dark: {
    bg: {
      primary: '#111827',
      secondary: '#1f2937',
      tertiary: '#374151',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
      inverse: '#111827',
    },
    border: '#374151',
    hover: '#1f2937',
  },
} as const;

/**
 * Chat Widget Specific Tokens
 */
export const CHAT_WIDGET_TOKENS = {
  // Message bubble spacing
  messagePadding: '12px 16px',
  messageBorderRadius: '8px',
  messageMaxWidth: '85%',

  // User vs Assistant messages
  userMessageBg: 'var(--color-primary-500)',
  assistantMessageBg: 'var(--color-gray-100)',
  userMessageTextColor: '#ffffff',
  assistantMessageTextColor: '#111827',

  // Input field
  inputBg: 'var(--color-gray-50)',
  inputBorder: 'var(--color-gray-200)',
  inputBorderRadius: '8px',
  inputPadding: '12px 16px',
  inputFontSize: '16px',

  // Animations
  messageAnimationDuration: '200ms',
  typingIndicatorDuration: '1.4s',
  fadeInDuration: '300ms',

  // Responsive
  mobileMessageMaxWidth: '90%',
  minWidgetHeight: '400px',
  maxWidgetHeight: '600px',
  minWidgetWidth: '300px',
  maxWidgetWidth: '500px',
} as const;
