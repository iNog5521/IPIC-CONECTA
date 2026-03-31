"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      
      if (fbUser) {
        // Força a liberação da catraca caso seja o usuário Mestre (Evita o delay da busca no DB)
        if (fbUser.email?.toLowerCase() === 'inog5521@gmail.com') {
          document.cookie = "admin_session=true; path=/; max-age=86400";
        }

        try {
          const docRef = doc(db, "users", fbUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(data);
            
            // Sincroniza o cargo com os Cookies para o Middleware liberar a rota /admin
            if (data.role === 'admin' || data.role === 'owner' || fbUser.email?.toLowerCase() === 'inog5521@gmail.com') {
              document.cookie = "admin_session=true; path=/; max-age=86400";
            } else {
              document.cookie = "admin_session=; path=/; max-age=0";
            }
          }
        } catch (error) {
          console.error("Erro ao buscar perfil:", error);
        }
      } else {
        setProfile(null);
        document.cookie = "admin_session=; path=/; max-age=0";
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
