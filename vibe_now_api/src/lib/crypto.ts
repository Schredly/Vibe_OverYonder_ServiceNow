// AES-256-GCM at-rest encryption for stored passwords and API keys.
// Master key is a 32-byte hex string in VIBE_MASTER_KEY. Each ciphertext is
// a base64 blob of: iv(12) || authTag(16) || ciphertext.

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

let cachedKey: Buffer | null = null;

function masterKey(): Buffer {
  if (cachedKey) return cachedKey;
  const hex = process.env.VIBE_MASTER_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'VIBE_MASTER_KEY must be a 64-char hex string (32 bytes). Generate one with `node -e "console.log(require(\\"crypto\\").randomBytes(32).toString(\\"hex\\"))"`.',
    );
  }
  cachedKey = Buffer.from(hex, 'hex');
  return cachedKey;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', masterKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(blob: string): string {
  const data = Buffer.from(blob, 'base64');
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const enc = data.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', masterKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}
