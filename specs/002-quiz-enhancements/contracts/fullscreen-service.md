# Fullscreen Service Contract

**Service**: Fullscreen Service  
**Type**: Browser API Wrapper / React Hook  
**Location**: `src/hooks/useFullscreen.ts`

## Overview

Service for managing browser fullscreen mode using native Fullscreen API. Provides fullscreen entry/exit, state detection, and error handling for quiz integrity requirements (FR-001, FR-002, FR-020, FR-021).

## Browser API

Uses native `Element.requestFullscreen()` API with vendor prefixes support.

## Interface

```typescript
interface FullscreenService {
  // Enter fullscreen mode
  enterFullscreen(element: HTMLElement): Promise<void>;
  
  // Exit fullscreen mode
  exitFullscreen(): Promise<void>;
  
  // Check if fullscreen is supported
  isSupported(): boolean;
  
  // Check if currently in fullscreen
  isFullscreen(): boolean;
  
  // Get fullscreen element
  getFullscreenElement(): Element | null;
}

interface FullscreenError {
  code: 'NOT_SUPPORTED' | 'PERMISSION_DENIED' | 'UNKNOWN';
  message: string;
}
```

## Methods

### enterFullscreen(element: HTMLElement): Promise<void>

Requests fullscreen mode for the specified element.

**Inputs**:
- `element`: HTMLElement - DOM element to make fullscreen (typically document.documentElement)

**Outputs**: Promise<void> - Resolves when fullscreen is entered, rejects on error

**Validation**:
- Checks if fullscreen API is supported (`document.fullscreenEnabled`)
- Checks if element is valid

**Side Effects**:
- Element enters fullscreen mode
- Browser UI elements are hidden
- Fires `fullscreenchange` event

**Errors**:
- `FullscreenError { code: 'NOT_SUPPORTED', message: 'Fullscreen API not supported' }` - Browser doesn't support fullscreen API (per FR-001)
- `FullscreenError { code: 'PERMISSION_DENIED', message: 'Fullscreen permission denied' }` - User denied fullscreen permission (per FR-001)
- `FullscreenError { code: 'UNKNOWN', message: 'Unknown fullscreen error' }` - Other error

**Implementation Notes**:
- Must check `document.fullscreenEnabled` before calling (per FR-001)
- Use vendor prefixes if needed (webkitRequestFullscreen, mozRequestFullScreen, msRequestFullscreen)
- Handle `fullscreenchange` event for state tracking

---

### exitFullscreen(): Promise<void>

Exits fullscreen mode.

**Inputs**: None

**Outputs**: Promise<void> - Resolves when fullscreen is exited

**Side Effects**:
- Browser exits fullscreen mode
- Browser UI elements are restored
- Fires `fullscreenchange` event

**Errors**: None (always succeeds, even if not in fullscreen)

**Implementation Notes**:
- Use `document.exitFullscreen()` with vendor prefix fallbacks
- Should show confirmation dialog per FR-021 if quiz is in progress

---

### isSupported(): boolean

Checks if fullscreen API is supported by the browser.

**Inputs**: None

**Outputs**:
- `boolean`: true if fullscreen API is supported, false otherwise

**Side Effects**: None

**Errors**: None

**Implementation Notes**:
- Check `document.fullscreenEnabled` or vendor-prefixed equivalent
- Used to determine if quiz can start (per FR-001)

---

### isFullscreen(): boolean

Checks if browser is currently in fullscreen mode.

**Inputs**: None

**Outputs**:
- `boolean`: true if in fullscreen, false otherwise

**Side Effects**: None

**Errors**: None

**Implementation Notes**:
- Check `document.fullscreenElement !== null` or vendor-prefixed equivalent

---

### getFullscreenElement(): Element | null

Returns the element currently in fullscreen mode.

**Inputs**: None

**Outputs**:
- `Element | null`: Fullscreen element or null if not in fullscreen

**Side Effects**: None

**Errors**: None

---

## React Hook Interface

```typescript
interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  enterFullscreen: (element?: HTMLElement) => Promise<void>;
  exitFullscreen: () => Promise<void>;
  error: FullscreenError | null;
}
```

### Hook Usage

```typescript
const { isFullscreen, isSupported, enterFullscreen, exitFullscreen, error } = useFullscreen();

// Enter fullscreen (defaults to document.documentElement)
await enterFullscreen();

// With specific element
await enterFullscreen(document.getElementById('quiz-container'));

// Exit fullscreen
await exitFullscreen();

// Check support
if (!isSupported) {
  // Show error message per FR-001
}
```

---

## Events

### fullscreenchange

Fired when fullscreen state changes (entered or exited).

**Event Handler**:
```typescript
document.addEventListener('fullscreenchange', () => {
  const isFullscreen = document.fullscreenElement !== null;
  // Handle state change
});
```

**Implementation Notes**:
- Listen to vendor-prefixed events if needed (webkitfullscreenchange, mozfullscreenchange, msfullscreenchange)
- Use to track fullscreen state in React hook
- Distinguish between programmatic exit and browser control exit (F11, etc.) per FR-020

---

## Error Handling (FR-001)

When fullscreen is not supported or permission is denied:

1. **NOT_SUPPORTED**: Display error message: "Fullscreen mode is required to start the quiz. Please use a modern browser that supports fullscreen."
2. **PERMISSION_DENIED**: Display error message: "Fullscreen permission was denied. Please allow fullscreen mode to start the quiz."
3. Quiz MUST NOT start (per FR-001)

---

## Browser Compatibility

- Chrome: Full support
- Firefox: Full support
- Safari: Full support (with webkit prefix)
- Edge: Full support

**Vendor Prefixes**:
- `webkitRequestFullscreen` (Safari)
- `mozRequestFullScreen` (Firefox)
- `msRequestFullscreen` (Edge)

---

## Integration with Quiz (FR-002)

When quiz enters fullscreen:
- Hide navigation elements (Header component)
- Hide browser UI
- Start quiz timer
- Apply fullscreen styles

---

## Exit Handling (FR-020, FR-021)

### Browser Control Exit (F11, Alt+Tab, etc.)
- Quiz continues normally
- No pause triggered
- No confirmation dialog
- Detect via `fullscreenchange` event without visibility change

### Programmatic Exit (Escape key, exit button)
- Show confirmation dialog per FR-021
- If confirmed: Exit fullscreen, quiz continues normally
- If cancelled: Stay in fullscreen
