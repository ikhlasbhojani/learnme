// Theme colors helper - GitHub-inspired black and white theme
export const getThemeColors = (isDark: boolean) => ({
  primary: isDark ? '#ffffff' : '#24292f',
  secondary: isDark ? '#0d1117' : '#ffffff',
  white: '#ffffff',
  black: '#000000',
  bg: isDark ? '#0d1117' : '#ffffff',
  text: isDark ? '#c9d1d9' : '#24292f',
  cardBg: isDark ? '#161b22' : '#f6f8fa',
  border: isDark ? '#30363d' : '#d0d7de',
  gray: isDark
    ? {
        50: '#161b22',
        100: '#1c2128',
        200: '#21262d',
        300: '#30363d',
        400: '#484f58',
        500: '#6e7681',
        600: '#8b949e',
        700: '#b1bac4',
        800: '#c9d1d9',
        900: '#f0f6fc',
      }
    : {
        50: '#f6f8fa',
        100: '#f0f3f6',
        200: '#e7edf3',
        300: '#d0d7de',
        400: '#afb8c1',
        500: '#8c959f',
        600: '#656d76',
        700: '#424a53',
        800: '#32383f',
        900: '#24292f',
      },
  success: isDark ? '#3fb950' : '#1a7f37',
  error: isDark ? '#f85149' : '#cf222e',
  warning: isDark ? '#d29922' : '#9a6700',
  info: isDark ? '#58a6ff' : '#0969da',
})

// Design system theme tokens (default light mode)
export const theme = {
  colors: {
    primary: '#000000',
    secondary: '#ffffff',
    white: '#ffffff',
    black: '#000000',
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    success: '#1a7f37',
    error: '#cf222e',
    warning: '#9a6700',
    info: '#0969da',
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    full: '9999px',
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
  },
  media: {
    mobile: '@media (max-width: 768px)',
    tablet: '@media (min-width: 769px) and (max-width: 1024px)',
    desktop: '@media (min-width: 1025px)',
  },
  shadows: {
    sm: '0 1px 0 rgba(27, 31, 36, 0.04)',
    md: '0 3px 6px rgba(140, 149, 159, 0.15)',
    lg: '0 8px 24px rgba(140, 149, 159, 0.2)',
    xl: '0 12px 48px rgba(140, 149, 159, 0.3)',
    '2xl': '0 16px 64px rgba(140, 149, 159, 0.4)',
    inner: 'inset 0 1px 0 rgba(208, 215, 222, 0.2)',
    glow: '0 0 0 1px rgba(208, 215, 222, 0.2), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
    'glow-lg': '0 0 0 1px rgba(208, 215, 222, 0.3), 0 3px 6px rgba(140, 149, 159, 0.15)',
  },
  glass: {
    light: 'rgba(255, 255, 255, 0.25)',
    medium: 'rgba(255, 255, 255, 0.18)',
    dark: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.18)',
  },
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  backdrop: {
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(12px)',
      xl: 'blur(16px)',
    },
  },
} as const

export type Theme = typeof theme
