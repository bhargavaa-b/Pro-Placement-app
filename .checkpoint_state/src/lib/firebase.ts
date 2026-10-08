import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validation constants synced verbatim with firebase-blueprint.json
export const ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;
export const MAX_ID_LENGTH = 128;
export const MAX_NAME_LENGTH = 100;
export const MAX_UNIVERSITY_LENGTH = 160;
export const MAX_GRAD_YEAR_LENGTH = 16;
export const MAX_EMAIL_LENGTH = 254;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ? '[PROTECTED_UID]' : null,
      email: auth.currentUser?.email ? '[PROTECTED_EMAIL]' : null,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email ? '[PROTECTED_EMAIL]' : null,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, MAX_ID_LENGTH);
  return cleaned.length > 0 ? cleaned : 'item_1';
}

export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export { onAuthStateChanged };

export async function syncCandidateToFirestore(
  profile: UserProfile
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const uid = sanitizeId(currentUser.uid);
  if (!ID_PATTERN.test(uid)) return;

  const userPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;

  const safeName = (profile.name || 'Candidate').trim().slice(0, MAX_NAME_LENGTH) || 'Candidate';
  const safeUni =
    (profile.university || 'Engineering Institution')
      .trim()
      .slice(0, MAX_UNIVERSITY_LENGTH) || 'Engineering Institution';
  const safeGradYear = (profile.graduationYear || '')
    .trim()
    .slice(0, MAX_GRAD_YEAR_LENGTH);
  const safeEmail = (profile.email || currentUser.email || 'user@example.com')
    .trim()
    .slice(0, MAX_EMAIL_LENGTH);

  const userRef = doc(db, 'users', uid);

  let exists = false;
  try {
    const snap = await getDoc(userRef);
    exists = snap.exists();
  } catch {
    exists = false;
  }

  if (!exists) {
    try {
      await setDoc(userRef, {
        ownerId: uid,
        name: safeName,
        university: safeUni,
        graduationYear: safeGradYear,
        streakDays: Math.max(0, Math.min(10000, Number(profile.streakDays) || 0)),
        streakShieldActive: Boolean(profile.streakShieldActive),
        highGameScore: Math.max(0, Math.min(10000000, Number(profile.highGameScore) || 0)),
        solvedDSACount: Math.max(0, Math.min(10000, profile.solvedDSAIds.length)),
        solvedAptitudeCount: Math.max(0, Math.min(50000, profile.solvedAptitudeIds.length)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }

    try {
      await setDoc(doc(db, 'users', uid, 'private', 'info'), {
        ownerId: uid,
        email: safeEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, privatePath);
    }
  } else {
    try {
      await updateDoc(userRef, {
        name: safeName,
        university: safeUni,
        graduationYear: safeGradYear,
        streakDays: Math.max(0, Math.min(10000, Number(profile.streakDays) || 0)),
        streakShieldActive: Boolean(profile.streakShieldActive),
        highGameScore: Math.max(0, Math.min(10000000, Number(profile.highGameScore) || 0)),
        solvedDSACount: Math.max(0, Math.min(10000, profile.solvedDSAIds.length)),
        solvedAptitudeCount: Math.max(0, Math.min(50000, profile.solvedAptitudeIds.length)),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }
}

export async function recordSolvedProblemInFirestore(
  problemId: string,
  category: 'DSA' | 'APTITUDE',
  isSolved: boolean
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const uid = sanitizeId(currentUser.uid);
  const safeProblemId = sanitizeId(problemId);
  if (!ID_PATTERN.test(uid) || !ID_PATTERN.test(safeProblemId)) return;

  const docPath = `users/${uid}/solvedProblems/${safeProblemId}`;
  const probRef = doc(db, 'users', uid, 'solvedProblems', safeProblemId);

  if (isSolved) {
    try {
      await setDoc(probRef, {
        ownerId: uid,
        problemId: safeProblemId,
        category,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  } else {
    try {
      await deleteDoc(probRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }
}

export async function loadCandidateFromFirestore(): Promise<Partial<UserProfile> | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return null;

  const uid = sanitizeId(currentUser.uid);

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    const solvedQuery = query(
      collection(db, 'users', uid, 'solvedProblems'),
      where('ownerId', '==', uid)
    );
    const solvedSnap = await getDocs(solvedQuery);
    const solvedDSAIds: string[] = [];
    const solvedAptitudeIds: string[] = [];

    solvedSnap.forEach((docSnap) => {
      const item = docSnap.data();
      if (item.category === 'DSA' && typeof item.problemId === 'string') {
        solvedDSAIds.push(item.problemId);
      } else if (item.category === 'APTITUDE' && typeof item.problemId === 'string') {
        solvedAptitudeIds.push(item.problemId);
      }
    });

    return {
      id: uid,
      name: data.name || currentUser.displayName || 'Candidate',
      email: currentUser.email || '',
      university: data.university || 'Engineering Institution',
      graduationYear: data.graduationYear || '',
      streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
      streakShieldActive: Boolean(data.streakShieldActive),
      highGameScore: typeof data.highGameScore === 'number' ? data.highGameScore : 0,
      solvedDSAIds,
      solvedAptitudeIds,
    };
  } catch {
    return null;
  }
}
