import { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Create profile
            const newProfile: Partial<UserProfile> = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Anonymous',
              photoURL: firebaseUser.photoURL || '',
              email: firebaseUser.email || '',
              role: firebaseUser.email === 'alemacedo@gmail.com' ? 'admin' : 'user',
              status: 'active',
              trophyLevel: 0,
              totalDrawings: 0,
              createdAt: serverTimestamp() as any
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile as UserProfile);
          }

          // Check if blocked
          const currentProfile = userDoc.exists() ? (userDoc.data() as UserProfile) : null;
          if (currentProfile?.status === 'blocked') {
            await auth.signOut();
            alert("Sua conta foi bloqueada pelo administrador.");
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, profile, loading };
}
