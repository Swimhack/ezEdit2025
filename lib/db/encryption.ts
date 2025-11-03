import crypto from 'crypto'

/**
 * Credential Encryption Service
 * Uses AES-256-GCM for encrypting ticket credentials
 * Credentials are encrypted before database storage and decrypted only for admin access
 */

interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

interface CredentialFields {
  host?: string
  username?: string
  password?: string
  api_key?: string
  api_secret?: string
}

class CredentialEncryption {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32 // 256 bits
  private readonly ivLength = 16 // 128 bits
  private readonly tagLength = 16 // 128 bits

  /**
   * Get encryption key from environment variable
   * Falls back to a default key in development (NOT SECURE for production)
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.EZEDIT_MASTER_KEY
    
    if (!key) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CREDENTIAL_ENCRYPTION_KEY must be set in production')
      }
      console.warn('⚠️  No CREDENTIAL_ENCRYPTION_KEY found, using default (NOT SECURE)')
      return crypto.createHash('sha256').update('default-insecure-key-change-in-production').digest()
    }

    try {
      // Try to decode as base64
      const decodedKey = Buffer.from(key, 'base64')
      if (decodedKey.length === 32) {
        return decodedKey
      }
      // If not 32 bytes, hash it to ensure correct length
      return crypto.createHash('sha256').update(key).digest()
    } catch {
      // If base64 decode fails, hash the string
      return crypto.createHash('sha256').update(key).digest()
    }
  }

  /**
   * Encrypt credential fields
   * Returns an object with encrypted data structure for JSONB storage
   */
  encryptCredentials(fields: CredentialFields): { encrypted_data: Record<string, EncryptedData> } {
    const encryptionKey = this.getEncryptionKey()
    const encryptedData: Record<string, EncryptedData> = {}

    for (const [key, value] of Object.entries(fields)) {
      if (value && typeof value === 'string') {
        const iv = crypto.randomBytes(this.ivLength)
        const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv)
        
        let encrypted = cipher.update(value, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        const authTag = cipher.getAuthTag()

        encryptedData[key] = {
          encrypted,
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex')
        }
      }
    }

    return { encrypted_data: encryptedData }
  }

  /**
   * Decrypt credential fields
   * Takes the encrypted_data JSONB and returns plaintext fields
   */
  decryptCredentials(encryptedDataJson: Record<string, EncryptedData> | null): CredentialFields {
    if (!encryptedDataJson || typeof encryptedDataJson !== 'object') {
      return {}
    }

    const encryptionKey = this.getEncryptionKey()
    const decryptedFields: CredentialFields = {}

    for (const [key, encryptedData] of Object.entries(encryptedDataJson)) {
      if (encryptedData && typeof encryptedData === 'object' && encryptedData.encrypted) {
        try {
          const decipher = crypto.createDecipheriv(
            this.algorithm,
            encryptionKey,
            Buffer.from(encryptedData.iv, 'hex')
          )
          
          decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
          
          let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
          decrypted += decipher.final('utf8')
          
          // Type-safe assignment
          if (key === 'host') decryptedFields.host = decrypted
          else if (key === 'username') decryptedFields.username = decrypted
          else if (key === 'password') decryptedFields.password = decrypted
          else if (key === 'api_key') decryptedFields.api_key = decrypted
          else if (key === 'api_secret') decryptedFields.api_secret = decrypted
        } catch (error) {
          console.error(`Failed to decrypt field ${key}:`, error)
          // Continue with other fields even if one fails
        }
      }
    }

    return decryptedFields
  }

  /**
   * Mask sensitive credential values for display
   * Shows first 2 and last 2 characters, masks the rest
   */
  maskCredential(value: string | undefined | null, minVisible: number = 2): string {
    if (!value || value.length <= minVisible * 2) {
      return '•'.repeat(8)
    }

    const visibleStart = value.substring(0, minVisible)
    const visibleEnd = value.substring(value.length - minVisible)
    const maskedLength = Math.max(4, value.length - (minVisible * 2))
    
    return `${visibleStart}${'•'.repeat(maskedLength)}${visibleEnd}`
  }

  /**
   * Generate a secure encryption key (for setup)
   * Returns a base64-encoded 32-byte key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('base64')
  }
}

// Export singleton instance
export const credentialEncryption = new CredentialEncryption()

// Export types
export type { CredentialFields, EncryptedData }

