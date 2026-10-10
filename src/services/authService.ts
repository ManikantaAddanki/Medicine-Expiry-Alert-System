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
import { UserMedicine } from '../types/userMedicine';

export interface AppUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
  isDemo?: boolean;
}

const LOCAL_USER_KEY = 'home_medicine_current_user_v1';

// Convert Firebase User to AppUserProfile
export function mapFirebaseUser(user: User | null): AppUserProfile | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Family Member',
    photoURL: user.photoURL,
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
        const profile = mapFirebaseUser(firebaseUser);
        try {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        } catch (e) {}
        callback(profile);
      } else {
        // Check for local demo user session
        try {
          const raw = localStorage.getItem(LOCAL_USER_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.isDemo) {
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
      return mapFirebaseUser(auth.currentUser);
    }
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  },

  /**
   * Register a new user with Email and Password
   */
  async registerWithEmail(fullName: string, email: string, pass: string): Promise<AppUserProfile> {
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (fullName.trim()) {
        await updateProfile(res.user, { displayName: fullName.trim() });
      }

      const profile: AppUserProfile = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: fullName.trim() || res.user.email?.split('@')[0] || 'Cabinet User'
      };

      // Save user profile to Firestore
      try {
        const userRef = doc(db, 'users', res.user.uid);
        await setDoc(userRef, {
          userId: res.user.uid,
          email: res.user.email,
          displayName: profile.displayName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore profile write notice:', e);
      }

      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      return profile;
    } catch (err: any) {
      // If Firebase Auth returns operation-not-allowed or similar, offer demo/local registration fallback
      if (err.code === 'auth/operation-not-allowed') {
        const demoUid = `user-${Date.now()}`;
        const localProfile: AppUserProfile = {
          uid: demoUid,
          email: email.trim(),
          displayName: fullName.trim() || 'Cabinet User',
          isDemo: true
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localProfile));
        return localProfile;
      }
      throw new Error(getAuthErrorMessage(err));
    }
  },

  /**
   * Log in an existing user with Email and Password
   */
  async loginWithEmail(email: string, pass: string): Promise<AppUserProfile> {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const profile = mapFirebaseUser(res.user)!;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      return profile;
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        // Fallback for demonstration when email auth provider is disabled in cloud console
        const demoUid = `user-${Date.now()}`;
        const localProfile: AppUserProfile = {
          uid: demoUid,
          email: email.trim(),
          displayName: email.split('@')[0],
          isDemo: true
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localProfile));
        return localProfile;
      }
      throw new Error(getAuthErrorMessage(err));
    }
  },

  /**
   * Google Sign-in popup
   */
  async loginWithGoogle(): Promise<{ profile: AppUserProfile; accessToken?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      const res = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(res);
      const profile = mapFirebaseUser(res.user)!;

      // Sync user profile to Firestore
      try {
        const userRef = doc(db, 'users', res.user.uid);
        await setDoc(userRef, {
          userId: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore profile sync notice:', e);
      }

      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      return { profile, accessToken: credential?.accessToken };
    } catch (err: any) {
      throw new Error(getAuthErrorMessage(err));
    }
  },

  /**
   * Instant Demo / Guest Family Account login
   */
  loginAsDemoUser(name = 'Dr. Sarah Jenkins (Family Caregiver)', email = 'sarah.jenkins@familyhealth.org'): AppUserProfile {
    const demoProfile: AppUserProfile = {
      uid: 'demo-user-sarah-jenkins',
      email,
      displayName: name,
      isDemo: true
    };
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoProfile));
    } catch (e) {}
    return demoProfile;
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
