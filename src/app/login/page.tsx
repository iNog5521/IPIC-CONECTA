import styles from "./page.module.css";
import Link from "next/link";
import { Mail, Lock, LogIn, Globe, ArrowRight, Heart } from "lucide-react";

export default function LoginPage() {
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

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label>E-mail</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} />
              <input type="email" placeholder="seu@email.com" required />
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
              <input type="password" placeholder="Digite sua senha" required />
            </div>
          </div>

          <button type="submit" className={styles.loginBtn}>
            Entrar <ArrowRight size={18} />
          </button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <button className={styles.googleBtn}>
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
