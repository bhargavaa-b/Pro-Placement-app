import { UserProfile } from '../types';

const VAULT_STORAGE_KEY = 'pp_secure_vault_v2';
const MULTI_USER_VAULT_KEY = 'pp_multi_user_vault_v2';
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

export function sanitizeCandidateProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    id: profile.id || `cand_${Date.now()}`,
    name: sanitizeStrictText(profile.name, 100) || 'Candidate',
    email: sanitizeStrictText(profile.email.toLowerCase(), 254),
    university:
      sanitizeStrictText(profile.university, 160) || 'Engineering Institution',
    graduationYear: sanitizeStrictText(profile.graduationYear || '', 16),
    dreamCompany: '',
    targetPackage: '',
    targetRole: '',
    solvedDSAIds: Array.isArray(profile.solvedDSAIds)
      ? Array.from(new Set(profile.solvedDSAIds))
      : [],
    solvedAptitudeIds: Array.isArray(profile.solvedAptitudeIds)
      ? Array.from(new Set(profile.solvedAptitudeIds))
      : [],
    bookmarkedDSAIds: Array.isArray(profile.bookmarkedDSAIds)
      ? Array.from(new Set(profile.bookmarkedDSAIds))
      : [],
  };
}

/**
 * Purges any legacy unencrypted profile keys to prevent plaintext data leakage.
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
 * Loads all encrypted candidate profiles stored on this device for multi-user switching.
 */
export function loadAllSavedProfiles(): UserProfile[] {
  try {
    const rawMulti = localStorage.getItem(MULTI_USER_VAULT_KEY);
    if (!rawMulti) return [];
    const decrypted = decryptPayload(rawMulti);
    if (!decrypted) return [];
    const parsed = JSON.parse(decrypted);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.email === 'string' && typeof p.name === 'string')
      .map((p) => sanitizeCandidateProfile(p as UserProfile));
  } catch {
    return [];
  }
}

function saveAllProfilesList(profiles: UserProfile[]): void {
  try {
    const encrypted = encryptPayload(JSON.stringify(profiles.slice(0, 25)));
    localStorage.setItem(MULTI_USER_VAULT_KEY, encrypted);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Saves the active candidate profile inside an encrypted, integrity-verified vault envelope
 * and upserts it into the encrypted multi-user device profile list.
 */
export function saveSecureProfile(profile: UserProfile): void {
  try {
    purgeLegacyPlaintextStorage();
    const sanitized = sanitizeCandidateProfile(profile);
    const encrypted = encryptPayload(JSON.stringify(sanitized));
    localStorage.setItem(VAULT_STORAGE_KEY, encrypted);

    // Also upsert into multi-user encrypted registry
    const existingList = loadAllSavedProfiles();
    const idx = existingList.findIndex(
      (item) => item.email.toLowerCase() === sanitized.email.toLowerCase()
    );
    if (idx >= 0) {
      const prev = existingList[idx];
      existingList[idx] = {
        ...prev,
        ...sanitized,
        highGameScore: Math.max(prev.highGameScore || 0, sanitized.highGameScore || 0),
        solvedDSAIds: Array.from(
          new Set([...(prev.solvedDSAIds || []), ...(sanitized.solvedDSAIds || [])])
        ),
        solvedAptitudeIds: Array.from(
          new Set([
            ...(prev.solvedAptitudeIds || []),
            ...(sanitized.solvedAptitudeIds || []),
          ])
        ),
        bookmarkedDSAIds: Array.from(
          new Set([
            ...(prev.bookmarkedDSAIds || []),
            ...(sanitized.bookmarkedDSAIds || []),
          ])
        ),
      };
    } else {
      existingList.unshift(sanitized);
    }
    saveAllProfilesList(existingList);
  } catch {
    // Non-blocking
  }
}

/**
 * Loads and verifies the active candidate profile from the encrypted vault.
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
          return sanitizeCandidateProfile(parsed as UserProfile);
        }
      }
    }

    // One-time migration from legacy key, followed by immediate purge of plaintext keys
    const legacyRaw = localStorage.getItem('pro_placement_active_profile');
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      purgeLegacyPlaintextStorage();
      if (parsed && parsed.email && parsed.name) {
        const clean = sanitizeCandidateProfile(parsed as UserProfile);
        saveSecureProfile(clean);
        return clean;
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
 * Removes a specific candidate account from the device's multi-user profile list.
 */
export function removeSavedProfile(email: string): UserProfile[] {
  try {
    const target = email.trim().toLowerCase();
    const filtered = loadAllSavedProfiles().filter(
      (p) => p.email.toLowerCase() !== target
    );
    saveAllProfilesList(filtered);
    return filtered;
  } catch {
    return [];
  }
}

/**
 * Clears the active candidate session on sign-out so another user can sign in cleanly,
 * while preserving the encrypted multi-user vault for 1-click account switching.
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
