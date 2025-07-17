/**
  * Generates a random alphanumeric ID of specified length
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generates a booking ID (10 characters max)
 */
export function generateBookingId(): string {
  // Create a short prefix to make it recognizable as a booking
  const prefix = 'B';
  // Generate a random ID with total length 10 (including prefix)
  return prefix + generateId(9);
}

/**
 * Generates a user ID (minimum 5 characters)
 */
export function generateUserId(): string {
  // Create a short prefix to make it recognizable as a user
  const prefix = 'U';
  // Generate a random ID with minimum 5 characters (including prefix)
  return prefix + generateId(4);
}

/**
 * Validates a user ID format
 */
export function isValidUserId(id: string): boolean {
  // Check if ID is at least 5 characters and contains only alphanumeric chars
  return id.length >= 5 && /^[A-Za-z0-9]+$/.test(id);
}
 