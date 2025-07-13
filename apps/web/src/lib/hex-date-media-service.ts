import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const DATE_SECRETS = {
  year: 0x5dd,
  month: 0xb1,
  day: 0xdc,
  hour: 0x23
} as const;

export class HexDateMediaService {
  private readonly cdnBaseUrl: string;
  private readonly storageBasePath: string;

  constructor(cdnBaseUrl?: string, storageBasePath?: string) {
    this.cdnBaseUrl = cdnBaseUrl || process.env.CDN_BASE_URL || 'https://cdn.itellico.com';
    this.storageBasePath = storageBasePath || process.env.STORAGE_BASE_PATH || './public';
  }

  /**
   * Generate hex-encoded date directory (pure hex date, no random strings)
   */
  private generateHexDateDirectory(): { hexDate: string; actualDate: Date } {
    const now = new Date();
    const obfuscatedYear = (now.getFullYear() ^ DATE_SECRETS.year);
    const obfuscatedMonth = ((now.getMonth() + 1) ^ DATE_SECRETS.month);
    const obfuscatedDay = (now.getDate() ^ DATE_SECRETS.day);
    const obfuscatedHour = (now.getHours() ^ DATE_SECRETS.hour);

    const yearHex = obfuscatedYear.toString(16).padStart(3, '0');
    const monthHex = obfuscatedMonth.toString(16).padStart(2, '0');
    const dayHex = obfuscatedDay.toString(16).padStart(2, '0');
    const hourHex = obfuscatedHour.toString(16).padStart(2, '0');

    // Pure hex date - no random suffix (9 characters total)
    const hexDate = `${yearHex}${monthHex}${dayHex}${hourHex}`;

    return { hexDate, actualDate: now };
  }

  /**
   * Generate a unique file hash using UUIDs and random component
   */
  private generateFileHash(tenantUuid: string, accountUuid: string, userUuid: string): string {
    // Combine UUIDs (remove hyphens for consistency)
    const combinedUuids = `${tenantUuid.replace(/-/g, '')}${accountUuid.replace(/-/g, '')}${userUuid.replace(/-/g, '')}`;

    // Add random component for uniqueness
    const randomHash = crypto.randomBytes(16).toString('hex');

    // Create final hash from combined UUIDs + random component
    const finalHash = crypto.createHash('sha256')
      .update(combinedUuids + randomHash)
      .digest('hex')
      .substring(0, 32); // Take first 32 characters

    return finalHash;
  }

  /**
   * Generate backend storage path using account UUID for organization
   */
  private generateBackendPath(accountUuid: string, hexDate: string, fileHash: string, extension: string): string {
    const yearHex = hexDate.substring(0, 3);
    const monthHex = hexDate.substring(3, 5);
    const dayHex = hexDate.substring(5, 7);
    const hourHex = hexDate.substring(7, 9);

    const hexDatePath = `${yearHex}/${monthHex}/${dayHex}/${hourHex}`;
    const fileName = `${hexDate}_${fileHash}.${extension}`;

    return path.join(this.storageBasePath, 'media', accountUuid, hexDatePath, fileName);
  }

  /**
   * Generate public CDN URL
   */
  private generatePublicUrl(accountUuid: string, hexDate: string, fileHash: string, extension: string): string {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      const yearHex = hexDate.substring(0, 3);
      const monthHex = hexDate.substring(3, 5);
      const dayHex = hexDate.substring(5, 7);
      const hourHex = hexDate.substring(7, 9);

      const hexDatePath = `${yearHex}/${monthHex}/${dayHex}/${hourHex}`;
      return `/media/${accountUuid}/${hexDatePath}/${hexDate}_${fileHash}.${extension}`;
    } else {
      return `${this.cdnBaseUrl}/media/${accountUuid}/${hexDate}/${fileHash}.${extension}`;
    }
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'bin';
  }

  private getMediaType(mimeType: string): 'photo' | 'video' | 'audio' | 'document' {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  /**
   * Upload file using account UUID for organization and UUID-based hash for uniqueness
   * Updated to use tenant UUID + account UUID + user UUID + random hash
   */
  async uploadFile(file: File, accountUuid: string, tenantUuid: string, userUuid: string): Promise<{
    directoryHash: string;
    fileHash: string;
    mediaType: 'photo' | 'video' | 'audio' | 'document';
  }> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { hexDate } = this.generateHexDateDirectory();
    const fileHash = this.generateFileHash(tenantUuid, accountUuid, userUuid);
    const fileExtension = this.getFileExtension(file.name);

    const backendPath = this.generateBackendPath(accountUuid, hexDate, fileHash, fileExtension);
    const backendDir = path.dirname(backendPath);
    await mkdir(backendDir, { recursive: true });
    await writeFile(backendPath, buffer);

    return {
      directoryHash: hexDate, // Pure hex date (9 characters) - no random strings
      fileHash, // UUID-based hash (32 characters)
      mediaType: this.getMediaType(file.type)
    };
  }

  /**
   * Compute CDN URL from stored components
   */
  computeCdnUrl(accountUuid: string, directoryHash: string, fileHash: string, originalName: string): string {
    const extension = this.getFileExtension(originalName);
    return this.generatePublicUrl(accountUuid, directoryHash, fileHash, extension);
  }
}

export const hexDateMediaService = new HexDateMediaService();
