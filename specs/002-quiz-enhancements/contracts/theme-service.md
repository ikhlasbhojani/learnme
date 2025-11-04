# Theme Service Contract

**Service**: Theme Service  
**Type**: State Management / React Hook  
**Location**: `src/hooks/useTheme.ts` and `src/contexts/ThemeContext.tsx`

## Overview

Service for managing application color themes with persistence across sessions. Supports theme switching, user preference storage, and immediate application across all pages (FR-015, FR-016, FR-017, FR-018, FR-019).

## Interface

```typescript
interface ThemeService {
  // Get current theme
  getCurrentTheme(): ThemeName;
  
  // Set theme
  setTheme(theme: ThemeName): Promise<void>;
  
  // Get available themes
  getAvailableThemes(): ThemeName[];
  
  // Load saved theme preference
  loadThemePreference(): ThemeName | null;
  
  // Save theme preference
  saveThemePreference(theme: ThemeName): Promise<void>;
}

type ThemeName = 'light' | 'dark' | 'blue' | 'green';

interface Theme {
  name: ThemeName;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
}
```

## Methods

### getCurrentTheme(): ThemeName

Returns the currently active theme.

**Inputs**: None

**Outputs**:
- `ThemeName`: Current theme identifier

**Side Effects**: None

**Errors**: None

---

### setTheme(theme: ThemeName): Promise<void>

Sets the active theme and applies it across the application.

**Inputs**:
- `theme`: ThemeName - Theme to apply

**Outputs**: Promise<void> - Resolves when theme is applied

**Validation**:
- Theme must be one of available themes (per FR-015 minimum: 'light', 'dark')

**Side Effects**:
- Updates CSS custom properties (CSS variables)
- Saves theme preference to user account (per FR-018)
- Applies theme immediately across all pages (per FR-017)
- Updates React context state

**Errors**:
- `"Invalid theme"` - Theme name is not in available themes list

**Implementation Notes**:
- Apply via CSS custom properties for efficient updates
- Update document.documentElement class or data attribute
- Save to localStorage immediately
- Update user object if authenticated (per FR-018)
- Smooth transition using CSS transitions (per SC-007: <500ms)

---

### getAvailableThemes(): ThemeName[]

Returns list of available theme options.

**Inputs**: None

**Outputs**:
- `ThemeName[]`: Array of available theme names

**Side Effects**: None

**Errors**: None

**Implementation Notes**:
- Minimum: ['light', 'dark'] per FR-015
- Can be extended with ['blue', 'green'] or more themes

---

### loadThemePreference(): ThemeName | null

Loads saved theme preference from user account or localStorage.

**Inputs**: None

**Outputs**:
- `ThemeName | null`: Saved theme preference or null if not set

**Side Effects**: None

**Errors**: None

**Implementation Notes**:
- First check user object (if authenticated) per FR-018
- Fallback to localStorage if user not authenticated
- Return null if no preference found (use system default)
- Called on login (per FR-019)

---

### saveThemePreference(theme: ThemeName): Promise<void>

Saves theme preference to user account and localStorage.

**Inputs**:
- `theme`: ThemeName - Theme to save

**Outputs**: Promise<void> - Resolves when saved

**Side Effects**:
- Updates user object with themePreference field (per FR-018)
- Saves to localStorage as cache
- Persists across devices and sessions for authenticated users

**Errors**: None (always succeeds, even if localStorage fails)

**Implementation Notes**:
- Store in user object when authenticated: `user.themePreference = theme`
- Store in localStorage: `learnme_theme_${userId}` or `learnme_theme` for anonymous
- Update immediately on change (per FR-017)

---

## React Context Interface

```typescript
interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => Promise<void>;
  availableThemes: ThemeName[];
  loading: boolean;
}
```

### Context Provider

```typescript
<ThemeProvider>
  <App />
</ThemeProvider>
```

**Initialization**:
- Load saved theme preference on mount
- Apply theme immediately
- Default to 'light' if no preference found

---

## React Hook Interface

```typescript
interface UseThemeReturn {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => Promise<void>;
  availableThemes: ThemeName[];
  toggleTheme: () => Promise<void>; // Toggle between light/dark
}
```

### Hook Usage

```typescript
const { theme, setTheme, availableThemes, toggleTheme } = useTheme();

// Set theme
await setTheme('dark');

// Toggle between light/dark
await toggleTheme();

// Get available options
const themes = availableThemes; // ['light', 'dark', 'blue', 'green']
```

---

## Storage Contract

### User Account Storage (FR-018)

**Extended User Type**:
```typescript
interface User {
  // ... existing fields ...
  themePreference: ThemeName | null;
}
```

**Storage Key**: `learnme_user` (localStorage)
**Field**: `user.themePreference`

**Persistence**:
- Stored in user object
- Persists across devices and sessions (per FR-018)
- Loaded on login (per FR-019)

### localStorage Cache

**Storage Key**: `learnme_theme_${userId}` (optional, for faster access)
**Format**: `ThemeName`

**Fallback**:
- If user not authenticated: Store in `learnme_theme`
- Session-only for anonymous users

---

## CSS Implementation

### CSS Custom Properties

```css
:root[data-theme="light"] {
  --color-primary: #0ea5e9;
  --color-background: #ffffff;
  --color-text: #111827;
  /* ... */
}

:root[data-theme="dark"] {
  --color-primary: #38bdf8;
  --color-background: #111827;
  --color-text: #f9fafb;
  /* ... */
}
```

**Application**:
- Set `data-theme` attribute on `document.documentElement`
- All components use CSS variables
- Smooth transitions via CSS `transition` property

**Performance**:
- No re-renders needed (CSS-only update)
- Achieves <500ms change time per SC-007

---

## Component Integration

### ThemeSelector Component

```typescript
interface ThemeSelectorProps {
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  showPreview?: boolean;
}
```

**Location**: `src/components/common/ThemeSelector.tsx`

**Features**:
- Display available themes (per FR-016)
- Show preview of each theme (per FR-015)
- Immediate theme application on selection
- Accessible: Keyboard navigation, ARIA labels

---

## User Flow

### Theme Selection (FR-016)

1. User accesses theme settings (settings page or theme selector)
2. Available themes displayed with previews
3. User selects theme
4. Theme applies immediately (per FR-017)
5. Theme preference saved to account (per FR-018)

### Theme Loading on Login (FR-019)

1. User logs in
2. System loads user object from localStorage
3. System reads `user.themePreference`
4. If themePreference exists: Apply theme immediately
5. If null: Use system default theme

### Theme Change During Quiz (FR-019)

1. User changes theme during active quiz
2. Theme applies to quiz interface immediately
3. Quiz progress not interrupted
4. Theme preference saved

---

## Validation Rules

### Theme Name Validation

- Must be one of: 'light', 'dark', 'blue', 'green'
- Case-sensitive
- Must match available themes list

### User Preference Validation

- `themePreference` can be `ThemeName | null`
- Null means use system default
- Must be valid theme name if set

---

## Error Handling

**Invalid Theme**:
- Log error
- Keep current theme
- Don't update preference

**Storage Failure (Save)** (per FR-018 clarification):
- Display notification to user about the failure
- Use default theme
- Theme still applies (CSS update succeeds)
- Preference may not persist across sessions

**Load Failure (Login)** (per FR-019 clarification):
- Use default theme
- Display notification to user about the failure
- Continue application normally
- User can manually set theme again

---

## Browser Compatibility

- CSS custom properties: Supported in all modern browsers
- localStorage: Supported in all modern browsers
- No polyfills required

---

## Performance Metrics (SC-007)

- Theme change must complete within 500ms
- No flickering or content jumps
- Smooth CSS transitions
- No layout shifts

---

## Accessibility

- Respects system theme preference (prefers-color-scheme)
- Keyboard navigation support
- Screen reader announcements
- High contrast themes supported
