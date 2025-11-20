// Theme colors helper - Professional GitHub-inspired theme with perfect contrast
export const getThemeColors = (isDark: boolean) => ({
  primary: isDark ? '#58a6ff' : '#0969da',  // Accent color for CTAs
  primaryHover: isDark ? '#79c0ff' : '#0550ae',
  secondary: isDark ? '#0d1117' : '#ffffff',
  white: '#ffffff',
  black: '#000000',
  bg: isDark ? '#0d1117' : '#ffffff',
  text: isDark ? '#e6edf3' : '#1f2328',  // Better contrast
  textSecondary: isDark ? '#9198a1' : '#59636e',  // Improved secondary text
  cardBg: isDark ? '#161b22' : '#f6f8fa',
  cardBgHover: isDark ? '#1c2128' : '#eaeef2',  // Subtle hover state
  border: isDark ? '#30363d' : '#d1d9e0',
  borderHover: isDark ? '#484f58' : '#a8b3c0',
  gray: isDark
    ? {
        50: '#0d1117',
        100: '#161b22',
        200: '#1c2128',
        300: '#21262d',
        400: '#30363d',
        500: '#484f58',
        600: '#656d76',
        700: '#8b949e',
        800: '#b1bac4',
        900: '#e6edf3',
      }
    : {
        50: '#ffffff',
        100: '#f6f8fa',
        200: '#eaeef2',
        300: '#d1d9e0',
        400: '#a8b3c0',
        500: '#6e7781',
        600: '#59636e',
        700: '#424a53',
        800: '#32383f',
        900: '#1f2328',
      },
  success: isDark ? '#3fb950' : '#1a7f37',
  successBg: isDark ? 'rgba(46, 160, 67, 0.15)' : 'rgba(26, 127, 55, 0.10)',
  error: isDark ? '#f85149' : '#cf222e',
  errorBg: isDark ? 'rgba(248, 81, 73, 0.15)' : 'rgba(207, 34, 46, 0.10)',
  warning: isDark ? '#d29922' : '#9a6700',
  warningBg: isDark ? 'rgba(210, 153, 34, 0.15)' : 'rgba(154, 103, 0, 0.10)',
  info: isDark ? '#58a6ff' : '#0969da',
  infoBg: isDark ? 'rgba(88, 166, 255, 0.15)' : 'rgba(9, 105, 218, 0.10)',
  accent: isDark ? '#a371f7' : '#8250df',  // Purple accent
  accentBg: isDark ? 'rgba(163, 113, 247, 0.15)' : 'rgba(130, 80, 223, 0.10)',
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
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    none: 'none',
  },
  shadowsDark: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)',
    outline: '0 0 0 3px rgba(88, 166, 255, 0.4)',
    none: 'none',
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
