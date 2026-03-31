import styles from "./page.module.css";
import Link from "next/link";
import { Mail, ArrowLeft, Send, Heart } from "lucide-react";

export default function EsqueciSenhaPage() {
  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Heart size={32} className={styles.logoIcon} />
          </div>
          <h1>Recuperar Acesso</h1>
          <p>Enviaremos um link de redefinição de senha da **IPIC CONECTA SEDE** para o seu e-mail.</p>
        </div>

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Seu e-mail cadastrado</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} />
              <input type="email" placeholder="seu@email.com" required />
            </div>
          </div>

          <button type="submit" className={styles.sendBtn}>
            Enviar E-mail de Recuperação <Send size={18} />
          </button>
        </form>

        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={16} /> Voltar para o Login
        </Link>
      </div>
    </div>
  );
}
