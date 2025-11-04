import { User } from '../types'
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from './storage'

/**
 * Hash password using Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

/**
 * Get current user from storage
 */
export function getCurrentUser(): User | null {
  return getStorageItem<User>(STORAGE_KEYS.USER)
}

/**
 * Save user to storage
 */
export function saveUser(user: User): void {
  setStorageItem(STORAGE_KEYS.USER, user)
}

/**
 * Remove user from storage
 */
export function removeUser(): void {
  removeStorageItem(STORAGE_KEYS.USER)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
