"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { Mail, ArrowLeft, Send, Heart, CheckCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Link de redefinição enviado! Verifique sua caixa de entrada.");
      setEmail(""); // limpa o campo
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        setErro("E-mail não encontrado em nossa base.");
      } else {
        setErro("Erro ao enviar o e-mail. Tente novamente mais tarde.");
      }
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
          </div>
          <h1>Recuperar Acesso</h1>
          <p>Enviaremos um link de redefinição de senha da **IPIC CONECTA** para o seu e-mail.</p>
        </div>

        {erro && <div className={styles.errorMsg}>{erro}</div>}
        {msg && <div className={styles.successMsg}><CheckCircle size={16} /> {msg}</div>}

        <form className={styles.form} onSubmit={handleResetPassword}>
          <div className={styles.inputGroup}>
            <label>Seu e-mail cadastrado</label>
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

          <button type="submit" className={styles.sendBtn} disabled={loading}>
            {loading ? "Enviando..." : "Enviar E-mail de Recuperação"} {!loading && <Send size={18} />}
          </button>
        </form>

        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={16} /> Voltar para o Login
        </Link>
      </div>
    </div>
  );
}
