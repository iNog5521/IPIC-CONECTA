"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Globe, ArrowRight, Heart } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.push("/perfil"); // Vai para a aba do perfil após o login
    } catch (error: any) {
      console.error(error);
      setErro("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErro("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check Se usuário for novo no Google, precisamos criar o doc no Firebase
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const isOwner = user.email === "inog5521@gmail.com";
        await setDoc(docRef, {
          nome: user.displayName || "Visitante",
          email: user.email,
          role: isOwner ? "owner" : "user",
          createdAt: new Date().toISOString()
        });
      }

      router.push("/perfil");
    } catch (error: any) {
      console.error(error);
      setErro("Falha no login com Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Heart size={32} className={styles.logoIcon} />
            <span className={styles.logoText}>IPIC CONECTA</span>
          </div>
          <h1>Bem-vindo de volta!</h1>
          <p>Acesse sua conta para continuar.</p>
        </div>

        {erro && <div className={styles.errorMsg}>{erro}</div>}

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label>E-mail</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} />
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required disabled={loading}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelRow}>
              <label>Senha</label>
              <Link href="/esqueci-senha" className={styles.forgotLink}>
                Esqueci minha senha
              </Link>
            </div>
            <div className={styles.inputWrapper}>
              <Lock size={18} />
              <input 
                type="password" 
                placeholder="Digite sua senha" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"} <ArrowRight size={18} />
          </button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <button className={styles.googleBtn} onClick={handleGoogleLogin} type="button" disabled={loading}>
          <Globe size={18} />
          Entrar com Google
        </button>

        <p className={styles.footer}>
          Novo por aqui? <Link href="/cadastro">Crie uma conta agora</Link>
        </p>
      </div>
    </div>
  );
}
