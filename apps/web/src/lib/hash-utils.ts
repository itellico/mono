import crypto from 'crypto';

/**
 * Generate a secure random hash for account organization
 * @param length - Length of the hash (32 for accounts, 16 for users)
 * @returns Hexadecimal hash string
 */
export function generateSecureHash(length: number = 32): string {
  const bytes = Math.ceil(length / 2);
  return crypto.randomBytes(bytes).toString('hex').substring(0, length);
}

/**
 * Generate a unique user hash (16 characters)  
 * Used for additional organization within account structure
 */
export function generateUserHash(): string {
  return generateSecureHash(16);
}

/**
 * Validate hash format
 */

export function isValidUserHash(hash: string): boolean {
  return /^[a-f0-9]{16}$/.test(hash);
}

/**
 * Generate hash with collision checking
 * @param generateFn - Function to generate hash
 * @param checkFn - Function to check if hash exists (should return Promise<boolean>)
 * @param maxAttempts - Maximum attempts before throwing error
 */
export async function generateUniqueHash(
  generateFn: () => string,
  checkFn: (hash: string) => Promise<boolean>,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const hash = generateFn();
    const exists = await checkFn(hash);

    if (!exists) {
      return hash;
    }

    if (attempt === maxAttempts) {
      throw new Error(`Failed to generate unique hash after ${maxAttempts} attempts`);
    }
  }

  throw new Error('Failed to generate unique hash');
} 