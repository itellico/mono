import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { logger } from '@/lib/logger';

// ============================
// ENCRYPTION UTILITIES
// ============================

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-key-not-secure';
const KEY_LENGTH = 32; // 256 bits

/**
 * Generate a proper encryption key from the provided string
 */
function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set');
  }

  // Create a 32-byte key from the provided key string
  const hash = createHash('sha256');
  hash.update(ENCRYPTION_KEY);
  return hash.digest();
}

/**
 * Encrypt a string value
 */
export async function encrypt(text: string): Promise<string> {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(16); // 128-bit IV for GCM
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV, authTag, and encrypted data
    const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    return combined;

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to encrypt data');
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt a string value
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = getEncryptionKey();

    // Split the combined data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to decrypt data');
    throw new Error('Decryption failed');
  }
}

/**
 * Check if a string appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  // Check if it has the proper format: iv:authTag:encrypted (3 parts separated by colons)
  const parts = value.split(':');
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
} 