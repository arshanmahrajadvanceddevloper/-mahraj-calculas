import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPhoneNumber, ConfirmationResult, ApplicationVerifier, signInWithCustomToken as firebaseSignInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signOut, handleFirestoreError, OperationType } from './firebase';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio: string;
  profession: string;
  themeTint: string;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithPhone: (phoneNumber: string, appVerifier: ApplicationVerifier) => Promise<ConfirmationResult>;
  signInWithToken: (token: string) => Promise<void>;
  triggerSimulatedSignIn: (phoneNumber: string) => void;
  logOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signInWithPhone: async () => { throw new Error('Not implemented'); },
  signInWithToken: async () => { throw new Error('Not implemented'); },
  triggerSimulatedSignIn: () => {},
  logOut: async () => {},
  updateProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulated session cache for running in locked or offline environments
  const [simulatedUser, setSimulatedUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('scientific_simulated_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [simulatedProfile, setSimulatedProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('scientific_simulated_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Clear simulated session cache when a real user logs in
        setSimulatedUser(null);
        setSimulatedProfile(null);
        localStorage.removeItem('scientific_simulated_user');
        localStorage.removeItem('scientific_simulated_profile');

        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const initialData = {
              userId: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              bio: '',
              profession: 'General',
              themeTint: 'lime',
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, initialData);
            setProfile({
              ...initialData,
              createdAt: new Date()
            } as UserProfile);
          } else {
            const data = userSnap.data();
            setProfile(data as UserProfile);
            const updates: any = {};
            if (!data.photoURL && currentUser.photoURL) {
              updates.photoURL = currentUser.photoURL;
            }
            if (!data.displayName && currentUser.displayName) {
              updates.displayName = currentUser.displayName;
            }
            if (Object.keys(updates).length > 0) {
              await setDoc(userRef, updates, { merge: true });
            }
          }
        } catch (error) {
          console.warn('[Firebase] Non-blocking initial user profile fetch:', error);
          // Fallback profile so app never freezes
          setProfile({
            userId: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Scholar',
            photoURL: currentUser.photoURL || '',
            bio: '',
            profession: 'General',
            themeTint: 'lime',
            createdAt: new Date()
          });
        }

        // Real-time listener for the user profile document (guarded against uncaught throws)
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            }
          }, (error) => {
            console.warn('[Firebase] Real-time profile sync error (non-fatal):', error);
          });
        } catch (err) {
          console.warn('[Firebase] Snapshot subscription warning:', err);
        }

      } else {
        setProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in cancelled by user.");
      } else {
        console.error("Sign in failed", error);
      }
    }
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: ApplicationVerifier): Promise<ConfirmationResult> => {
    try {
      return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    } catch (error) {
      console.error("Phone Auth sign-in failed: ", error);
      throw error;
    }
  };

  const signInWithToken = async (token: string): Promise<void> => {
    try {
      if (token && token.startsWith('simulated-token-for-')) {
        const email = token.replace('simulated-token-for-', '');
        triggerSimulatedSignIn(email);
        return;
      }
      await firebaseSignInWithCustomToken(auth, token);
    } catch (error) {
      console.error("Custom token sign-in failed: ", error);
      throw error;
    }
  };

  const triggerSimulatedSignIn = (identifier: string) => {
    const isEmail = identifier.includes('@');
    const emailStr = isEmail ? identifier : `${identifier.replace(/\D/g, '') || 'sandbox'}@phone.academic.dev`;
    const cleanId = isEmail ? identifier.replace(/[^a-zA-Z0-9]/g, '') : (identifier.replace(/\D/g, '') || 'sandbox');
    const mockUser = {
      uid: `sim-${cleanId}`,
      email: emailStr,
      displayName: isEmail ? identifier.split('@')[0] : 'Researcher',
      photoURL: '',
      phoneNumber: isEmail ? '' : identifier,
    };
    setSimulatedUser(mockUser);
    localStorage.setItem('scientific_simulated_user', JSON.stringify(mockUser));

    const mockProfile: UserProfile = {
      userId: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      photoURL: '',
      bio: 'Academic Explorer',
      profession: 'General',
      themeTint: 'lime',
      createdAt: new Date().toISOString()
    };
    setSimulatedProfile(mockProfile);
    localStorage.setItem('scientific_simulated_profile', JSON.stringify(mockProfile));
  };

  const logOut = async () => {
    try {
      if (simulatedUser) {
        setSimulatedUser(null);
        setSimulatedProfile(null);
        localStorage.removeItem('scientific_simulated_user');
        localStorage.removeItem('scientific_simulated_profile');
      }
      await signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (simulatedUser) {
      const newProfile: UserProfile = {
        userId: simulatedUser.uid,
        email: simulatedUser.email || 'sandbox@academic.dev',
        displayName: typeof updates.displayName !== 'undefined' ? (updates.displayName || '') : (simulatedProfile?.displayName || 'Researcher'),
        photoURL: typeof updates.photoURL !== 'undefined' ? (updates.photoURL || '') : (simulatedProfile?.photoURL || ''),
        bio: typeof updates.bio !== 'undefined' ? (updates.bio || '') : (simulatedProfile?.bio || ''),
        profession: updates.profession || simulatedProfile?.profession || 'General',
        themeTint: updates.themeTint || simulatedProfile?.themeTint || 'lime',
        createdAt: simulatedProfile?.createdAt || new Date().toISOString()
      };
      setSimulatedProfile(newProfile);
      localStorage.setItem('scientific_simulated_profile', JSON.stringify(newProfile));
      return;
    }
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const activeUser = user || (simulatedUser as any as User);
  const activeProfile = profile || simulatedProfile;

  return (
    <AuthContext.Provider value={{ 
      user: activeUser, 
      profile: activeProfile, 
      loading, 
      signIn, 
      signInWithPhone, 
      signInWithToken,
      triggerSimulatedSignIn, 
      logOut, 
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
