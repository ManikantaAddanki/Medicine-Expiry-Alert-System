import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebaseClient';
import { UserMedicine, UserRole } from '../types/userMedicine';

export interface AppUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
  isAnonymous?: boolean;
  isDemo?: boolean;
  createdAt?: string;
  medicinesCount?: number;
}

const LOCAL_USER_KEY = 'home_medicine_current_user_v2';
const USERS_REGISTRY_KEY = 'home_medicine_users_registry_v2';

// Pre-seeded system accounts for multi-role administration & testing
const DEFAULT_DEMO_USERS: AppUserProfile[] = [
  {
    uid: 'demo-admin-manikanta',
    email: 'admin@medicinecabinet.local',
    displayName: 'Addanki Manikanta (Lead Admin)',
    role: 'admin',
    isDemo: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    medicinesCount: 8
  },
  {
    uid: 'demo-caregiver-sarah',
    email: 'sarah.caregiver@familyhealth.org',
    displayName: 'Sarah Jenkins (Family Caregiver)',
    role: 'caregiver',
    isDemo: true,
    createdAt: '2026-09-15T14:30:00.000Z',
    medicinesCount: 6
  },
  {
    uid: 'demo-pharmacist-robert',
    email: 'dr.robert.vance@pharmacy.org',
    displayName: 'Dr. Robert Vance, PharmD',
    role: 'pharmacist',
    isDemo: true,
    createdAt: '2026-09-20T09:15:00.000Z',
    medicinesCount: 12
  },
  {
    uid: 'demo-patient-alex',
    email: 'alex.patient@homecare.net',
    displayName: 'Alex Johnson (Patient)',
    role: 'patient',
    isDemo: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    medicinesCount: 3
  }
];

function getStoredUsersRegistry(): AppUserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (raw) {
      const parsed: AppUserProfile[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  // Default seed
  try {
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(DEFAULT_DEMO_USERS));
  } catch (e) {}
  return [...DEFAULT_DEMO_USERS];
}

function saveUserToRegistry(user: AppUserProfile) {
  try {
    const currentList = getStoredUsersRegistry();
    const index = currentList.findIndex(u => u.uid === user.uid || (u.email && u.email.toLowerCase() === (user.email || '').toLowerCase()));
    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...user };
    } else {
      currentList.unshift(user);
    }
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(currentList));
  } catch (e) {}
}

// Convert Firebase User to AppUserProfile with role
export function mapFirebaseUser(user: User | null, defaultRole: UserRole = 'caregiver'): AppUserProfile | null {
  if (!user) return null;
  
  // Check if role already exists in stored registry
  const registry = getStoredUsersRegistry();
  const existing = registry.find(u => u.uid === user.uid || (u.email && u.email === user.email));
  const role: UserRole = existing?.role || defaultRole;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Cabinet User',
    photoURL: user.photoURL,
    role,
    isAnonymous: user.isAnonymous
  };
}

export const authService = {
  /**
   * Listen to auth state transitions
   */
  subscribeToAuth(callback: (user: AppUserProfile | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch latest role and details from Firestore
        let profileRole: UserRole = 'caregiver';
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists() && snap.data().role) {
            profileRole = snap.data().role as UserRole;
          }
        } catch (e) {}

        const profile = mapFirebaseUser(firebaseUser, profileRole)!;
        profile.role = profileRole;
        try {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
          saveUserToRegistry(profile);
        } catch (e) {}
        callback(profile);
      } else {
        // Check for local demo user session
        try {
          const raw = localStorage.getItem(LOCAL_USER_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.isDemo || parsed.uid)) {
              callback(parsed);
              return;
            }
          }
        } catch (e) {}
        callback(null);
      }
    });
  },

  getCurrentUser(): AppUserProfile | null {
    if (auth.currentUser) {
      const mapped = mapFirebaseUser(auth.currentUser);
      // augment with locally cached role if available
      try {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.role && mapped) {
            mapped.role = parsed.role;
          }
        }
      } catch (e) {}
      return mapped;
    }
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  },

  /**
   * Register a new user with Email, Password, and Role specification
   */
  async registerWithEmail(
    fullName: string, 
    email: string, 
    pass: string, 
    role: UserRole = 'caregiver'
  ): Promise<AppUserProfile> {
    const cleanEmail = email.trim();
    const cleanName = fullName.trim() || cleanEmail.split('@')[0] || 'Cabinet User';
    const nowIso = new Date().toISOString();

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cleanName) {
        await updateProfile(res.user, { displayName: cleanName });
      }

      const profile: AppUserProfile = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: cleanName,
        role,
        createdAt: nowIso
      };

      // Save user profile to Firestore with role
      try {
        const userRef = doc(db, 'users', res.user.uid);
        await setDoc(userRef, {
          userId: res.user.uid,
          email: res.user.email,
          displayName: profile.displayName,
          role,
          createdAt: nowIso,
          updatedAt: nowIso
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore profile write notice:', e);
      }

      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      saveUserToRegistry(profile);
      return profile;
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        // Fallback for demo when Email Auth is disabled in cloud project
        const demoUid = `user-${Date.now()}`;
        const localProfile: AppUserProfile = {
          uid: demoUid,
          email: cleanEmail,
          displayName: cleanName,
          role,
          isDemo: true,
          createdAt: nowIso
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localProfile));
        saveUserToRegistry(localProfile);
        return localProfile;
      }
      throw new Error(getAuthErrorMessage(err));
    }
  },

  /**
   * Log in an existing user with Email and Password
   */
  async loginWithEmail(email: string, pass: string): Promise<AppUserProfile> {
    const cleanEmail = email.trim();
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      
      // Fetch user role from Firestore
      let userRole: UserRole = 'caregiver';
      try {
        const snap = await getDoc(doc(db, 'users', res.user.uid));
        if (snap.exists() && snap.data().role) {
          userRole = snap.data().role as UserRole;
        }
      } catch (e) {}

      const profile = mapFirebaseUser(res.user, userRole)!;
      profile.role = userRole;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      saveUserToRegistry(profile);
      return profile;
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        const demoUid = `user-${Date.now()}`;
        const registry = getStoredUsersRegistry();
        const existing = registry.find(u => u.email?.toLowerCase() === cleanEmail.toLowerCase());
        const localProfile: AppUserProfile = {
          uid: existing?.uid || demoUid,
          email: cleanEmail,
          displayName: existing?.displayName || cleanEmail.split('@')[0],
          role: existing?.role || 'caregiver',
          isDemo: true,
          createdAt: existing?.createdAt || new Date().toISOString()
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localProfile));
        saveUserToRegistry(localProfile);
        return localProfile;
      }
      throw new Error(getAuthErrorMessage(err));
    }
  },

  /**
   * Google Sign-in popup with Gmail scope
   */
  async loginWithGoogle(defaultRole: UserRole = 'admin'): Promise<{ profile: AppUserProfile; accessToken?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      const res = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(res);

      let userRole: UserRole = defaultRole;
      try {
        const snap = await getDoc(doc(db, 'users', res.user.uid));
        if (snap.exists() && snap.data().role) {
          userRole = snap.data().role as UserRole;
        }
      } catch (e) {}

      const profile = mapFirebaseUser(res.user, userRole)!;
      profile.role = userRole;

      // Sync user profile to Firestore with role
      try {
        const userRef = doc(db, 'users', res.user.uid);
        await setDoc(userRef, {
          userId: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
          role: userRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore profile sync notice:', e);
      }

      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      saveUserToRegistry(profile);
      return { profile, accessToken: credential?.accessToken };
    } catch (err: any) {
      throw new Error(getAuthErrorMessage(err));
    }
  },

  /**
   * Fast Demo / Role-Based Switcher for rapid system validation
   */
  loginAsDemoUser(
    name = 'Addanki Manikanta (System Admin)', 
    email = 'admin@medicinecabinet.local',
    role: UserRole = 'admin'
  ): AppUserProfile {
    const demoProfile: AppUserProfile = {
      uid: `demo-${role}-${Date.now().toString().slice(-4)}`,
      email,
      displayName: name,
      role,
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoProfile));
      saveUserToRegistry(demoProfile);
    } catch (e) {}
    return demoProfile;
  },

  /**
   * Quickly update the current user's role (for testing & role demonstration)
   */
  updateCurrentUserRole(newRole: UserRole): AppUserProfile | null {
    const current = this.getCurrentUser();
    if (!current) return null;
    current.role = newRole;
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(current));
      saveUserToRegistry(current);
    } catch (e) {}
    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        setDoc(userRef, { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {}
    }
    return current;
  },

  /**
   * Get all registered and active users for Admin Module
   */
  async getAllUsers(): Promise<AppUserProfile[]> {
    const localUsers = getStoredUsersRegistry();
    try {
      if (auth.currentUser) {
        const usersColl = collection(db, 'users');
        const snap = await getDocs(usersColl);
        if (!snap.empty) {
          const cloudUsers: AppUserProfile[] = snap.docs.map(d => {
            const data = d.data();
            return {
              uid: data.userId || d.id,
              email: data.email || null,
              displayName: data.displayName || 'Cabinet User',
              role: (data.role as UserRole) || 'caregiver',
              createdAt: data.createdAt || new Date().toISOString()
            };
          });

          // Merge cloud & local unique by uid
          const map = new Map<string, AppUserProfile>();
          localUsers.forEach(u => map.set(u.uid, u));
          cloudUsers.forEach(u => map.set(u.uid, u));
          return Array.from(map.values());
        }
      }
    } catch (e) {
      console.warn('Could not read cloud users list, using local registry:', e);
    }
    return localUsers;
  },

  /**
   * Admin function: Update a user's role
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    const list = getStoredUsersRegistry();
    const target = list.find(u => u.uid === userId);
    if (target) {
      target.role = newRole;
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(list));
    }
    // If it's current user, also update session
    const current = this.getCurrentUser();
    if (current && current.uid === userId) {
      current.role = newRole;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(current));
    }
    // Update in Firestore
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore update role notice:', e);
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      throw new Error(getAuthErrorMessage(err));
    }
  },

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {}
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
    } catch (e) {}
  },

  /**
   * Sync medicines to Firestore for logged-in user
   */
  async syncMedicinesToCloud(userId: string, medicines: UserMedicine[]): Promise<void> {
    if (!userId || userId.startsWith('demo-')) return;
    try {
      const batch = writeBatch(db);
      for (const med of medicines.slice(0, 50)) {
        const medRef = doc(db, 'users', userId, 'medicines', med.id);
        batch.set(medRef, {
          ...med,
          userId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Sync medicines to Firestore notice:', e);
    }
  },

  /**
   * Fetch medicines from Firestore for logged-in user
   */
  async fetchMedicinesFromCloud(userId: string): Promise<UserMedicine[] | null> {
    if (!userId || userId.startsWith('demo-')) return null;
    try {
      const medsColl = collection(db, 'users', userId, 'medicines');
      const snap = await getDocs(medsColl);
      if (snap.empty) return null;
      return snap.docs.map(d => d.data() as UserMedicine);
    } catch (e) {
      console.warn('Fetch medicines from Firestore notice:', e);
      return null;
    }
  }
};

function getAuthErrorMessage(err: any): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please log in instead.';
    case 'auth/invalid-email':
      return 'The email address entered is not formatted properly.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify and try again.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long for optimal security.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few minutes or reset your password.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connectivity.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled on this Firebase project.';
    default:
      return err?.message || 'Authentication failed. Please check your credentials and try again.';
  }
}
