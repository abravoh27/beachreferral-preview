'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Si un admin desactivó esta cuenta (active === false), se cierra
            // la sesión de inmediato. Si el campo no existe (usuarios viejos),
            // se trata como activa por defecto.
            if (data.active === false) {
              console.warn('Cuenta desactivada por un administrador.');
              await auth.signOut();
              setUser(null);
              setUserRole(null);
            } else {
              setUser(firebaseUser);
              setUserRole(data.role);
            }
          } else {
            console.error("No user document found!");
            auth.signOut();
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          auth.signOut();
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = { user, userRole, loading };
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
