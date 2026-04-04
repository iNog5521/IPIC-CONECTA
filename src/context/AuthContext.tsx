"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  // true assim que o onSnapshot disparar pela primeira vez para o usuário atual.
  // Usado para distinguir "perfil carregando" de "perfil não existe".
  profileFetched: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileFetched: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetched, setProfileFetched] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // Founder não precisa de verificação de e-mail
      const isFounder = fbUser?.email?.toLowerCase() === 'inog5521@gmail.com';

      if (fbUser && !fbUser.emailVerified && !isFounder) {
        // Se o usuário está no fluxo de cadastro, NÃO interromper.
        // O onAuthStateChanged dispara imediatamente após createUserWithEmailAndPassword,
        // antes que setDoc consiga salvar o perfil no Firestore. Forçar signOut aqui
        // cria uma race condition que faz o setDoc falhar silenciosamente (cache offline).
        if (typeof window !== 'undefined' && window.location.pathname === '/cadastro') {
          setUser(fbUser);
          setProfile(null);
          setProfileFetched(false);
          setLoading(false);
          return; // Deixa o fluxo de cadastro concluir normalmente
        }

        // Fora do cadastro: usuário não verificou o e-mail → faz logout
        await auth.signOut();
        setUser(null);
        setProfile(null);
        setProfileFetched(false);
        setLoading(false);
        window.location.href = "/login?verified=false";
        return;
      }

      setUser(fbUser);

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = undefined;
      }

      if (fbUser) {
        // Novo usuário autenticado: resetar o flag enquanto o perfil carrega
        setProfileFetched(false);

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
            // Marca que o Firestore já respondeu ao menos uma vez para este usuário
            setProfileFetched(true);
            setLoading(false);
          }, (error) => {
            console.error("Erro ao escutar perfil em tempo real:", error);
            setProfileFetched(true);
            setLoading(false);
          });
        } catch (error) {
          console.error("Erro na referência do perfil:", error);
          setProfileFetched(true);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setProfileFetched(false);
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
    <AuthContext.Provider value={{ user, profile, loading, profileFetched }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
