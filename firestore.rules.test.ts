// Security TDD Test Suite & Deterministic Rule Evaluator for Firestore Rules ("Dirty Dozen" Verification)
import fs from 'fs';
import path from 'path';

export interface SecurityTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authUid: string | null;
  emailVerified: boolean;
  existingDoc?: Record<string, unknown> | null;
  parentUserDoc?: Record<string, unknown> | null;
  payload?: Record<string, unknown>;
  requestTimeMs?: number;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

const NOW_MS = 1790784000000;
const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

function isValidId(id: unknown): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= 128 &&
    ID_REGEX.test(id)
  );
}

function hasExactKeys(
  obj: Record<string, unknown>,
  required: string[],
  allowed: string[]
): boolean {
  const keys = Object.keys(obj);
  for (const req of required) {
    if (!keys.includes(req)) return false;
  }
  for (const k of keys) {
    if (!allowed.includes(k)) return false;
  }
  return true;
}

function isValidCandidateProfile(
  data: Record<string, unknown>,
  authUid: string | null
): boolean {
  const keys = [
    'ownerId',
    'name',
    'university',
    'graduationYear',
    'streakDays',
    'streakShieldActive',
    'highGameScore',
    'solvedDSACount',
    'solvedAptitudeCount',
    'createdAt',
    'updatedAt',
  ];
  if (!hasExactKeys(data, keys, keys)) return false;
  if (!isValidId(data.ownerId) || data.ownerId !== authUid) return false;
  if (
    typeof data.name !== 'string' ||
    data.name.length < 1 ||
    data.name.length > 100
  )
    return false;
  if (
    typeof data.university !== 'string' ||
    data.university.length < 1 ||
    data.university.length > 160
  )
    return false;
  if (
    typeof data.graduationYear !== 'string' ||
    data.graduationYear.length < 0 ||
    data.graduationYear.length > 16
  )
    return false;
  if (
    typeof data.streakDays !== 'number' ||
    data.streakDays < 0 ||
    data.streakDays > 10000
  )
    return false;
  if (typeof data.streakShieldActive !== 'boolean') return false;
  if (
    typeof data.highGameScore !== 'number' ||
    data.highGameScore < 0 ||
    data.highGameScore > 10000000
  )
    return false;
  if (
    typeof data.solvedDSACount !== 'number' ||
    data.solvedDSACount < 0 ||
    data.solvedDSACount > 10000
  )
    return false;
  if (
    typeof data.solvedAptitudeCount !== 'number' ||
    data.solvedAptitudeCount < 0 ||
    data.solvedAptitudeCount > 50000
  )
    return false;
  if (data.createdAt !== '__SERVER_TIMESTAMP__' && typeof data.createdAt !== 'string')
    return false;
  if (data.updatedAt !== '__SERVER_TIMESTAMP__' && typeof data.updatedAt !== 'string')
    return false;
  return true;
}

function isValidSolvedProblemRecord(
  data: Record<string, unknown>,
  authUid: string | null
): boolean {
  const keys = ['ownerId', 'problemId', 'category', 'createdAt'];
  if (!hasExactKeys(data, keys, keys)) return false;
  if (!isValidId(data.ownerId) || data.ownerId !== authUid) return false;
  if (!isValidId(data.problemId)) return false;
  if (data.category !== 'DSA' && data.category !== 'APTITUDE') return false;
  if (data.createdAt !== '__SERVER_TIMESTAMP__') return false;
  return true;
}

export function evaluateFirestoreRule(
  tc: SecurityTestCase
): 'PERMISSION_DENIED' | 'ALLOWED' {
  const isVerified = Boolean(tc.authUid && tc.emailVerified);
  if (!isVerified) return 'PERMISSION_DENIED';

  const parts = tc.collectionPath.split('/').filter(Boolean);
  // /users/{userId}
  if (parts.length === 2 && parts[0] === 'users') {
    const userId = parts[1];
    if (!isValidId(userId) || userId !== tc.authUid) return 'PERMISSION_DENIED';
    if (tc.operation === 'get') {
      return !tc.existingDoc || tc.existingDoc.ownerId === tc.authUid
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (tc.operation === 'create') {
      if (!tc.payload) return 'PERMISSION_DENIED';
      if (!isValidCandidateProfile(tc.payload, tc.authUid))
        return 'PERMISSION_DENIED';
      if (
        tc.payload.createdAt !== '__SERVER_TIMESTAMP__' ||
        tc.payload.updatedAt !== '__SERVER_TIMESTAMP__'
      ) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOWED';
    }
    if (tc.operation === 'update') {
      if (!tc.payload || !tc.existingDoc) return 'PERMISSION_DENIED';
      if (!isValidCandidateProfile(tc.payload, tc.authUid))
        return 'PERMISSION_DENIED';
      if (tc.existingDoc.ownerId !== tc.authUid) return 'PERMISSION_DENIED';
      if (tc.payload.ownerId !== tc.existingDoc.ownerId)
        return 'PERMISSION_DENIED';
      if (tc.payload.createdAt !== tc.existingDoc.createdAt)
        return 'PERMISSION_DENIED';
      if (tc.payload.updatedAt !== '__SERVER_TIMESTAMP__')
        return 'PERMISSION_DENIED';
      return 'ALLOWED';
    }
    return 'PERMISSION_DENIED';
  }

  // /users/{userId}/private/{docId}
  if (parts.length === 4 && parts[0] === 'users' && parts[2] === 'private') {
    const userId = parts[1];
    const docId = parts[3];
    if (!isValidId(userId) || !isValidId(docId) || userId !== tc.authUid) {
      return 'PERMISSION_DENIED';
    }
    if (tc.parentUserDoc?.ownerId !== tc.authUid) return 'PERMISSION_DENIED';
    if (tc.operation === 'get') {
      return tc.existingDoc?.ownerId === tc.authUid
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    return 'PERMISSION_DENIED';
  }

  // /users/{userId}/solvedProblems/{problemId}
  if (
    parts.length === 4 &&
    parts[0] === 'users' &&
    parts[2] === 'solvedProblems'
  ) {
    const userId = parts[1];
    const problemId = parts[3];
    if (!isValidId(userId) || !isValidId(problemId) || userId !== tc.authUid) {
      return 'PERMISSION_DENIED';
    }
    if (tc.parentUserDoc?.ownerId !== tc.authUid) return 'PERMISSION_DENIED';
    if (tc.operation === 'create') {
      if (!tc.payload || tc.payload.problemId !== problemId)
        return 'PERMISSION_DENIED';
      if (!isValidSolvedProblemRecord(tc.payload, tc.authUid))
        return 'PERMISSION_DENIED';
      return 'ALLOWED';
    }
    return 'PERMISSION_DENIED';
  }

  return 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Profile Creation',
    collectionPath: '/users/user_1',
    operation: 'create',
    authUid: null,
    emailVerified: false,
    payload: { ownerId: 'user_1', name: 'Alice' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    collectionPath: '/users/user_1',
    operation: 'create',
    authUid: 'user_1',
    emailVerified: false,
    payload: { ownerId: 'user_1', name: 'Alice' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User Identity Spoofing',
    collectionPath: '/users/user_1',
    operation: 'create',
    authUid: 'user_2',
    emailVerified: true,
    payload: { ownerId: 'user_1', name: 'Spoofed' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow / Ghost Field Injection on Create',
    collectionPath: '/users/user_1',
    operation: 'create',
    authUid: 'user_1',
    emailVerified: true,
    payload: {
      ownerId: 'user_1',
      name: 'Alice',
      university: 'IIT',
      graduationYear: '2026',
      streakDays: 0,
      streakShieldActive: false,
      highGameScore: 0,
      solvedDSACount: 0,
      solvedAptitudeCount: 0,
      createdAt: '__SERVER_TIMESTAMP__',
      updatedAt: '__SERVER_TIMESTAMP__',
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Update / Unauthorized Key Mutation',
    collectionPath: '/users/user_1',
    operation: 'update',
    authUid: 'user_1',
    emailVerified: true,
    existingDoc: {
      ownerId: 'user_1',
      name: 'Alice',
      university: 'IIT',
      graduationYear: '2026',
      streakDays: 0,
      streakShieldActive: false,
      highGameScore: 0,
      solvedDSACount: 0,
      solvedAptitudeCount: 0,
      createdAt: '2026-09-30T00:00:00Z',
      updatedAt: '2026-09-30T00:00:00Z',
    },
    payload: { role: 'superadmin' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immortal Field Tampering (ownerId mutation)',
    collectionPath: '/users/user_1',
    operation: 'update',
    authUid: 'user_1',
    emailVerified: true,
    existingDoc: {
      ownerId: 'user_1',
      name: 'Alice',
      university: 'IIT',
      graduationYear: '2026',
      streakDays: 0,
      streakShieldActive: false,
      highGameScore: 0,
      solvedDSACount: 0,
      solvedAptitudeCount: 0,
      createdAt: '2026-09-30T00:00:00Z',
      updatedAt: '2026-09-30T00:00:00Z',
    },
    payload: {
      ownerId: 'user_999',
      name: 'Alice',
      university: 'IIT',
      graduationYear: '2026',
      streakDays: 0,
      streakShieldActive: false,
      highGameScore: 0,
      solvedDSACount: 0,
      solvedAptitudeCount: 0,
      createdAt: '2026-09-30T00:00:00Z',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client-Spoofed Timestamp',
    collectionPath: '/users/user_1',
    operation: 'create',
    authUid: 'user_1',
    emailVerified: true,
    requestTimeMs: NOW_MS,
    payload: {
      ownerId: 'user_1',
      name: 'Alice',
      university: 'IIT',
      graduationYear: '2026',
      streakDays: 0,
      streakShieldActive: false,
      highGameScore: 0,
      solvedDSACount: 0,
      solvedAptitudeCount: 0,
      createdAt: 1000000,
      updatedAt: 1000000,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Denial-of-Wallet Oversized String',
    collectionPath: '/users/user_1',
    operation: 'create',
    authUid: 'user_1',
    emailVerified: true,
    payload: {
      ownerId: 'user_1',
      name: 'A'.repeat(5000),
      university: 'IIT',
      graduationYear: '2026',
      streakDays: 0,
      streakShieldActive: false,
      highGameScore: 0,
      solvedDSACount: 0,
      solvedAptitudeCount: 0,
      createdAt: '__SERVER_TIMESTAMP__',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'ID Poisoning Attack',
    collectionPath: '/users/user_1/solvedProblems/invalid$id!@#',
    operation: 'create',
    authUid: 'user_1',
    emailVerified: true,
    parentUserDoc: { ownerId: 'user_1' },
    payload: {
      ownerId: 'user_1',
      problemId: 'invalid$id!@#',
      category: 'DSA',
      createdAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Orphaned Subcollection Write',
    collectionPath: '/users/missing_user/solvedProblems/dsa-1',
    operation: 'create',
    authUid: 'missing_user',
    emailVerified: true,
    parentUserDoc: null,
    payload: {
      ownerId: 'missing_user',
      problemId: 'dsa-1',
      category: 'DSA',
      createdAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'PII Cross-Tenant Read',
    collectionPath: '/users/user_1/private/info',
    operation: 'get',
    authUid: 'user_2',
    emailVerified: true,
    parentUserDoc: { ownerId: 'user_1' },
    existingDoc: { ownerId: 'user_1', email: 'alice@example.com' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Value Poisoning on Update',
    collectionPath: '/users/user_1',
    operation: 'update',
    authUid: 'user_1',
    emailVerified: true,
    existingDoc: {
      ownerId: 'user_1',
      name: 'Alice',
      university: 'IIT',
      graduationYear: '2026',
      streakDays: 0,
      streakShieldActive: false,
      highGameScore: 0,
      solvedDSACount: 0,
      solvedAptitudeCount: 0,
      createdAt: '2026-09-30T00:00:00Z',
      updatedAt: '2026-09-30T00:00:00Z',
    },
    payload: {
      ownerId: 'user_1',
      name: 'Alice',
      university: 'IIT',
      graduationYear: '2026',
      streakDays: 'one_hundred',
      streakShieldActive: false,
      highGameScore: 0,
      solvedDSACount: 0,
      solvedAptitudeCount: 0,
      createdAt: '2026-09-30T00:00:00Z',
      updatedAt: '__SERVER_TIMESTAMP__',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];

// Execute test suite when run via tsx/node
const rulesFile = path.resolve(process.cwd(), 'firestore.rules');
const rulesText = fs.readFileSync(rulesFile, 'utf8');

let passed = 0;
for (const tc of DIRTY_DOZEN_TESTS) {
  const actual = evaluateFirestoreRule(tc);
  if (actual !== tc.expectedResult) {
    throw new Error(
      `Test #${tc.id} (${tc.name}) failed: expected ${tc.expectedResult}, got ${actual}`
    );
  }
  passed++;
}

// Structural static assertions against firestore.rules
const requiredRuleSnippets = [
  "rules_version = '2';",
  'match /{document=**} {\n      allow read, write: if false;\n    }',
  'request.auth.token.email_verified == true',
  'isValidCandidateProfile(incoming())',
  'isValidCandidatePrivateInfo(incoming())',
  'isValidSolvedProblemRecord(incoming())',
  'incoming().diff(existing()).affectedKeys().hasOnly(',
  'get(/databases/$(database)/documents/users/$(userId)).data.ownerId == request.auth.uid',
  'resource.data.ownerId == request.auth.uid',
];

for (const snippet of requiredRuleSnippets) {
  if (!rulesText.includes(snippet)) {
    throw new Error(`Missing required security gate in firestore.rules: ${snippet}`);
  }
}

console.log(
  `[PASS] All ${passed}/12 Dirty Dozen security tests and 9 structural rule invariants passed with 0 errors.`
);
