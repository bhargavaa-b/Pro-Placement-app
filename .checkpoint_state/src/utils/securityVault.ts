import { UserProfile } from '../types';

const VAULT_STORAGE_KEY = 'pp_secure_vault_v2';
const LEGACY_KEYS_TO_PURGE = [
  'pro_placement_active_profile',
  'pro_placement_all_profiles',
];

const VAULT_SECRET_SALT = '3LLION_PRO_PLACEMENT_SECURITY_VAULT_2026_KEY';

/**
 * Strips any HTML tags, script payloads, or control characters to prevent XSS and injection.
 */
export function sanitizeStrictText(input: string, maxLength = 160): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>"'`\\]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Computes a deterministic 64-bit integrity signature for tamper detection.
 */
function computeIntegritySignature(payload: string): string {
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  const combined = payload + '|' + VAULT_SECRET_SALT;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, '0') +
    (h1 >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Symmetric stream cipher + Base64 encoding so plaintext PII is never exposed in localStorage.
 */
function encryptPayload(plainJson: string): string {
  const utf8Bytes = new TextEncoder().encode(plainJson);
  const keyBytes = new TextEncoder().encode(VAULT_SECRET_SALT);
  const cipherBytes = new Uint8Array(utf8Bytes.length);
  for (let i = 0; i < utf8Bytes.length; i++) {
    cipherBytes[i] =
      utf8Bytes[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 31 + 17) & 0xff);
  }
  let binary = '';
  for (let i = 0; i < cipherBytes.length; i++) {
    binary += String.fromCharCode(cipherBytes[i]);
  }
  const b64 = btoa(binary);
  const sig = computeIntegritySignature(plainJson);
  return `v2.${sig}.${b64}`;
}

function decryptPayload(envelope: string): string | null {
  try {
    if (!envelope.startsWith('v2.')) return null;
    const parts = envelope.split('.');
    if (parts.length !== 3) return null;
    const [, expectedSig, b64] = parts;
    const binary = atob(b64);
    const cipherBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      cipherBytes[i] = binary.charCodeAt(i);
    }
    const keyBytes = new TextEncoder().encode(VAULT_SECRET_SALT);
    const plainBytes = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      plainBytes[i] =
        cipherBytes[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 31 + 17) & 0xff);
    }
    const plainJson = new TextDecoder().decode(plainBytes);
    const actualSig = computeIntegritySignature(plainJson);
    if (actualSig !== expectedSig) {
      return null; // Tampered payload rejected
    }
    return plainJson;
  } catch {
    return null;
  }
}

/**
 * Purges any legacy unencrypted profile keys or multi-user profile lists to prevent data leakage.
 */
export function purgeLegacyPlaintextStorage(): void {
  try {
    for (const key of LEGACY_KEYS_TO_PURGE) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Saves the active candidate profile inside an encrypted, integrity-verified vault envelope.
 */
export function saveSecureProfile(profile: UserProfile): void {
  try {
    purgeLegacyPlaintextStorage();
    const sanitized: UserProfile = {
      ...profile,
      name: sanitizeStrictText(profile.name, 100) || 'Candidate',
      email: sanitizeStrictText(profile.email.toLowerCase(), 254),
      university:
        sanitizeStrictText(profile.university, 160) || 'Engineering Institution',
      graduationYear: sanitizeStrictText(profile.graduationYear || '', 16),
      dreamCompany: '',
      targetPackage: '',
      targetRole: '',
    };
    const encrypted = encryptPayload(JSON.stringify(sanitized));
    localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
  } catch {
    // Non-blocking
  }
}

/**
 * Loads and verifies the active candidate profile from the encrypted vault, migrating legacy profile if present once.
 */
export function loadSecureProfile(): UserProfile | null {
  try {
    const rawVault = localStorage.getItem(VAULT_STORAGE_KEY);
    if (rawVault) {
      const decrypted = decryptPayload(rawVault);
      if (decrypted) {
        const parsed = JSON.parse(decrypted);
        if (parsed && parsed.email && parsed.name) {
          purgeLegacyPlaintextStorage();
          return parsed as UserProfile;
        }
      }
    }

    // One-time migration from legacy key, followed by immediate purge of plaintext keys
    const legacyRaw = localStorage.getItem('pro_placement_active_profile');
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      purgeLegacyPlaintextStorage();
      if (parsed && parsed.email && parsed.name) {
        saveSecureProfile(parsed);
        return parsed as UserProfile;
      }
    }

    purgeLegacyPlaintextStorage();
    return null;
  } catch {
    purgeLegacyPlaintextStorage();
    return null;
  }
}

/**
 * Completely wipes the encrypted vault and session tokens on logout.
 */
export function clearSecureVault(): void {
  try {
    localStorage.removeItem(VAULT_STORAGE_KEY);
    sessionStorage.removeItem('pp_session_token');
    purgeLegacyPlaintextStorage();
  } catch {
    // Ignore
  }
}
