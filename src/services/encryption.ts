// Simple encryption service for data at rest
// Note: For production, use a more robust encryption library

export class EncryptionService {
  private encryptionKey: CryptoKey | null = null;
  
  async initialize(): Promise<boolean> {
    try {
      // Check if we have a stored key
      const storedKey = localStorage.getItem('encryptionKey');
      
      if (storedKey) {
        // Import the existing key
        const keyData = JSON.parse(storedKey);
        this.encryptionKey = await window.crypto.subtle.importKey(
          'jwk',
          keyData,
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate a new key
        this.encryptionKey = await window.crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        );
        
        // Export and store the key
        const exportedKey = await window.crypto.subtle.exportKey('jwk', this.encryptionKey);
        localStorage.setItem('encryptionKey', JSON.stringify(exportedKey));
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing encryption service:', error);
      return false;
    }
  }
  
  async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }
    
    try {
      // Generate a random initialization vector
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Convert the data to an ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Encrypt the data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.encryptionKey,
        dataBuffer
      );
      
      // Combine the IV and encrypted data
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }
    
    try {
      // Convert from base64
      const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extract the IV (first 12 bytes)
      const iv = encryptedBytes.slice(0, 12);
      
      // Extract the encrypted data
      const data = encryptedBytes.slice(12);
      
      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.encryptionKey,
        data
      );
      
      // Convert the decrypted data back to a string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

// Create and export a singleton instance
const encryptionService = new EncryptionService();
export default encryptionService;
