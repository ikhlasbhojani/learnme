/**
 * Utility function to generate a unique ID
 * Note: MongoDB will auto-generate ObjectIds, but we keep this for compatibility
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}
