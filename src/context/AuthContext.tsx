"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      
      if (unsubProfile) {
        unsubProfile();
      }
      
      if (fbUser) {
        // Força a liberação da catraca caso seja o usuário Mestre
        if (fbUser.email?.toLowerCase() === 'inog5521@gmail.com') {
          document.cookie = "admin_session=true; path=/; max-age=86400";
        }

        try {
          const docRef = doc(db, "users", fbUser.uid);
          unsubProfile = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setProfile(data);
              
              if (data.role === 'admin' || data.role === 'owner' || fbUser.email?.toLowerCase() === 'inog5521@gmail.com') {
                document.cookie = "admin_session=true; path=/; max-age=86400";
              } else {
                // Caso seja rebaixado para usuário em tempo real
                document.cookie = "admin_session=; path=/; max-age=0";
              }
            } else {
              setProfile(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Erro ao escutar perfil em tempo real:", error);
            setLoading(false);
          });
        } catch (error) {
          console.error("Erro na referência do perfil:", error);
          setLoading(false);
        }
      } else {
        setProfile(null);
        document.cookie = "admin_session=; path=/; max-age=0";
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
