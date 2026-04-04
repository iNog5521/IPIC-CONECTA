"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setProfileLoading(false);
      return;
    }

    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setLoading(false);

      // Limpar inscrição anterior se o usuário mudar
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = undefined;
      }

      if (fbUser) {
        // Regra de verificação de e-mail (exceto para o admin fundador)
        const isFounder = fbUser.email?.toLowerCase() === 'inog5521@gmail.com';
        
        if (!fbUser.emailVerified && !isFounder) {
          // Se não estiver verificado, permitimos o estado mas não liberamos o perfil completo
          // A proteção de rotas deve ser feita via Middleware ou nas páginas
          setProfile(null);
          setProfileLoading(false);
          return;
        }

        setProfileLoading(true);
        try {
          const docRef = doc(db, "users", fbUser.uid);
          unsubProfile = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              setProfile(data);
              
              // Gerenciar cookie de admin para o Middleware
              if (data.role === 'admin' || data.role === 'owner' || isFounder) {
                document.cookie = "admin_session=true; path=/; max-age=86400";
              } else {
                document.cookie = "admin_session=; path=/; max-age=0";
              }
            } else {
              setProfile(null);
            }
            setProfileLoading(false);
          }, (error) => {
            console.error("Erro ao escutar perfil:", error);
            setProfileLoading(false);
          });
        } catch (error) {
          console.error("Erro na referência do perfil:", error);
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
        setProfileLoading(false);
        document.cookie = "admin_session=; path=/; max-age=0";
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
