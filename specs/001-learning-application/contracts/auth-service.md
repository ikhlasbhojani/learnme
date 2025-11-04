# Authentication Service Contract

**Service**: Auth Service  
**Type**: Internal Service Interface  
**Location**: `src/services/auth.ts` or `src/hooks/useAuth.ts`

## Overview

Client-side authentication service for user signup, login, logout, and session management. Uses localStorage for persistence.

## Interface

```typescript
interface AuthService {
  // Signup
  signup(email: string, password: string): Promise<AuthResult>;
  
  // Login
  login(email: string, password: string): Promise<AuthResult>;
  
  // Logout
  logout(): Promise<void>;
  
  // Get current user
  getCurrentUser(): User | null;
  
  // Check if user is authenticated
  isAuthenticated(): boolean;
  
  // Validate password policy
  validatePassword(password: string): ValidationResult;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

## Methods

### signup(email: string, password: string): Promise<AuthResult>

Creates a new user account with email and password.

**Inputs**:
- `email`: string - Valid email address
- `password`: string - Password meeting policy (8+ chars, letter + number)

**Outputs**:
- `AuthResult`: Success with user object, or error message

**Validation**:
- Email format validation
- Email uniqueness check (against localStorage)
- Password policy validation (FR-001a)

**Side Effects**:
- Creates User entity
- Stores in localStorage (`learnme_user`)
- Establishes session

**Errors**:
- `"Email already exists"` - Email is already registered
- `"Invalid email format"` - Email format is invalid
- `"Password does not meet requirements"` - Password policy violation

---

### login(email: string, password: string): Promise<AuthResult>

Authenticates user with email and password.

**Inputs**:
- `email`: string - User email
- `password`: string - User password

**Outputs**:
- `AuthResult`: Success with user object, or error message

**Validation**:
- Email exists in localStorage
- Password hash matches stored hash

**Side Effects**:
- Updates `lastLoginAt` timestamp
- Establishes session

**Errors**:
- `"Invalid credentials"` - Email or password incorrect
- `"User not found"` - Email not registered

---

### logout(): Promise<void>

Logs out current user and clears session.

**Inputs**: None

**Outputs**: void

**Side Effects**:
- Clears user from localStorage
- Clears session data
- Redirects to login page

**Errors**: None (always succeeds)

---

### getCurrentUser(): User | null

Returns current authenticated user or null.

**Inputs**: None

**Outputs**:
- `User | null`: Current user object or null if not authenticated

**Side Effects**: None

**Errors**: None

---

### isAuthenticated(): boolean

Checks if user is currently authenticated.

**Inputs**: None

**Outputs**:
- `boolean`: true if authenticated, false otherwise

**Side Effects**: None

**Errors**: None

---

### validatePassword(password: string): ValidationResult

Validates password against policy requirements.

**Inputs**:
- `password`: string - Password to validate

**Outputs**:
- `ValidationResult`: Validation result with errors array

**Validation Rules**:
- Minimum 8 characters
- At least one letter (a-z, A-Z)
- At least one number (0-9)

**Errors Array**:
- `"Password must be at least 8 characters"` - Length violation
- `"Password must contain at least one letter"` - Letter missing
- `"Password must contain at least one number"` - Number missing

---

## React Hook Interface

```typescript
interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  signup: (email: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}
```

## Usage Example

```typescript
// In component
const { user, signup, login, logout, isAuthenticated } = useAuth();

// Signup
const result = await signup("user@example.com", "password123");
if (result.success) {
  // Navigate to home
}

// Login
const result = await login("user@example.com", "password123");
if (result.success) {
  // Navigate to home
}

// Logout
await logout();
```

---

## Storage Contract

**localStorage Key**: `learnme_user`

**Storage Format**:
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  "passwordHash": "hashed-password",
  "createdAt": "2024-12-19T10:00:00Z",
  "lastLoginAt": "2024-12-19T10:00:00Z"
}
```

---

## Security Considerations

- Passwords are hashed using Web Crypto API (`crypto.subtle.digest`)
- Password hashes stored in localStorage (client-side only)
- No password transmission to backend (MVP)
- Session persistence via localStorage (not secure, but acceptable for MVP)
- Future: Move to secure backend with proper session management
