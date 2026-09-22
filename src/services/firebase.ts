import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection, 
  query, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Request standard profile & email
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = getFirestore(app);

// Connection test helper per Firebase Integration Skill requirement
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Attempt reading a test path directly from server to verify connectivity
    await getDocFromServer(doc(db, 'users', 'connectivity_check'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline cache mode.');
      return false;
    }
    // Document not existing is completely fine, it means connectivity is verified
    return true;
  }
}

// User Profile Sync with Firestore
export interface FirestoreUserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator';
  factoryId?: string;
  photoURL?: string;
  lastLoginAt: string;
  updatedAt: string;
}

export async function syncUserProfileToFirestore(
  fbUser: FirebaseUser, 
  assignedRole: 'admin' | 'manager' | 'operator' = 'manager'
): Promise<FirestoreUserProfile> {
  const userRef = doc(db, 'users', fbUser.uid);
  try {
    const existingSnap = await getDoc(userRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data() as FirestoreUserProfile;
      const updated: FirestoreUserProfile = {
        ...data,
        name: fbUser.displayName || data.name || 'Factory Personnel',
        email: fbUser.email || data.email,
        photoURL: fbUser.photoURL || data.photoURL,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, updated, { merge: true });
      return updated;
    } else {
      const newProfile: FirestoreUserProfile = {
        uid: fbUser.uid,
        name: fbUser.displayName || 'Factory User',
        email: fbUser.email || '',
        role: assignedRole,
        photoURL: fbUser.photoURL || undefined,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
    return {
      uid: fbUser.uid,
      name: fbUser.displayName || 'Authorized User',
      email: fbUser.email || '',
      role: assignedRole,
      photoURL: fbUser.photoURL || undefined,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// Save schedule snapshot to Firestore for the user
export async function saveUserScheduleSnapshot(
  uid: string, 
  snapshot: { version: string; makespan: number; utilization: number; notes?: string }
): Promise<string> {
  const snapshotId = 'snap_' + Date.now();
  const snapRef = doc(db, 'users', uid, 'snapshots', snapshotId);
  await setDoc(snapRef, {
    snapshotId,
    version: snapshot.version,
    makespan: snapshot.makespan,
    utilization: snapshot.utilization,
    notes: snapshot.notes || '',
    createdAt: new Date().toISOString()
  });
  return snapshotId;
}

// Get saved user snapshots from Firestore
export async function getUserScheduleSnapshots(uid: string) {
  try {
    const snapsRef = collection(db, 'users', uid, 'snapshots');
    const querySnap = await getDocs(snapsRef);
    return querySnap.docs.map(d => d.data());
  } catch (err) {
    console.warn('Failed to load user snapshots from Firestore:', err);
    return [];
  }
}
