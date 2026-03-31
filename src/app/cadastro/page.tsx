import styles from "./page.module.css";
import Link from "next/link";
import { User, Mail, Lock, Phone, MapPin, Calendar, ArrowRight } from "lucide-react";

export default function CadastroPage() {
  const SEDES = ["Sede Central", "Sede Norte", "Sede Sul"];

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <h1>Criar Conta</h1>
          <p>Junte-se à comunidade IPIC CONECTA SEDE.</p>
        </div>

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nome Completo*</label>
            <div className={styles.inputWrapper}>
              <User size={18} />
              <input type="text" placeholder="Como quer ser chamado?" required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>E-mail*</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} />
              <input type="email" placeholder="seu@email.com" required />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Nascimento*</label>
              <div className={styles.inputWrapper}>
                <Calendar size={18} />
                <input type="date" required />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Telefone (Opcional)</label>
              <div className={styles.inputWrapper}>
                <Phone size={18} />
                <input type="tel" placeholder="(11) 99999-9999" />
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Sua Sede*</label>
            <div className={styles.inputWrapper}>
              <MapPin size={18} />
              <select required className={styles.select}>
                <option value="">Selecione sua sede...</option>
                {SEDES.map(sede => (
                  <option key={sede} value={sede}>{sede}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Defina uma Senha*</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} />
              <input type="password" placeholder="Mínimo 6 caracteres" required />
            </div>
          </div>

          <button type="submit" className={styles.registerBtn}>
            Criar minha conta <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footer}>
          Já tem uma conta? <Link href="/login">Fazer Login</Link>
        </p>
      </div>
    </div>
  );
}
