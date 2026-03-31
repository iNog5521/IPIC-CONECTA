import styles from "./page.module.css";
import { MapPin, Clock, CheckCircle, ChevronRight } from "lucide-react";

export default function CultosPage() {
  const SEDES = [
    { name: "Sede Central", address: "Rua Principal, 100", open: true },
    { name: "Sede Norte", address: "Avenida Norte, 500", open: false },
    { name: "Sede Sul", address: "Estrada Sul, 20", open: false }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Programação</h1>
        <p className={styles.subtitle}>Encontre o melhor horário para adorarmos juntos.</p>
      </header>

      <div className={styles.sedesSelector}>
        {SEDES.map((sede) => (
          <button key={sede.name} className={`${styles.sedeBtn} ${sede.open ? styles.active : ''}`}>
            {sede.name}
          </button>
        ))}
      </div>

      <div className={styles.agenda}>
        <div className={styles.dayGroup}>
          <h2 className={styles.dayTitle}>Domingo</h2>
          <div className={styles.cultoCard}>
            <div className={styles.timeInfo}>
              <Clock size={16} />
              <span>09:30h</span>
            </div>
            <div className={styles.cultoDetails}>
              <h3>Arrebatamento e Oração</h3>
              <p>Escola Bíblica Dominical</p>
            </div>
            <button className={styles.confirmBtn}>Confirmar</button>
          </div>

          <div className={styles.cultoCard}>
            <div className={styles.timeInfo}>
              <Clock size={16} />
              <span>18:30h</span>
            </div>
            <div className={styles.cultoDetails}>
              <h3>Celebração da Família</h3>
              <p>Culto Principal</p>
            </div>
            <button className={styles.confirmBtn}>Confirmar</button>
          </div>
        </div>

        <div className={styles.dayGroup}>
          <h2 className={styles.dayTitle}>Quarta-feira</h2>
          <div className={styles.cultoCard}>
            <div className={styles.timeInfo}>
              <Clock size={16} />
              <span>20:00h</span>
            </div>
            <div className={styles.cultoDetails}>
              <h3>Noite de Poder</h3>
              <p>Estudo bíblico e oração</p>
            </div>
            <button className={styles.confirmBtn}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
