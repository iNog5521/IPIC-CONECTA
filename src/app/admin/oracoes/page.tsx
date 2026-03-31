import styles from "./page.module.css";
import { Heart, CheckCircle, Trash2, MapPin, User, Search } from "lucide-react";

export default function AdminOracoesPage() {
  const PRAYERS = [
    { id: 1, name: "Maria Oliveira", sede: "Sede Central", text: "Oração pela saúde da minha mãe que está no hospital.", date: "Há 2 horas", status: "Pendente" },
    { id: 2, name: "Carlos Medeiros", sede: "Sede Norte", text: "Pedido de oração pela minha nova jornada de emprego.", date: "Ontem", status: "Pendente" },
    { id: 3, name: "Ana Souza", sede: "Sede Sul", text: "Gratidão por uma graça alcançada esta semana.", date: "2 dias atrás", status: "Visto" },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Inbox de Orações</h1>
          <p className={styles.subtitle}>Acompanhe e interaja com os pedidos da comunidade.</p>
        </div>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Buscar pedidos..." />
        </div>
      </header>

      <div className={styles.grid}>
        {PRAYERS.map((prayer) => (
          <div key={prayer.id} className={styles.prayerCard}>
            <div className={styles.cardHeader}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>{prayer.name.charAt(0)}</div>
                <div className={styles.details}>
                  <span className={styles.name}>{prayer.name}</span>
                  <span className={styles.sede}><MapPin size={12} /> {prayer.sede}</span>
                </div>
              </div>
              <span className={styles.date}>{prayer.date}</span>
            </div>
            
            <div className={styles.prayerBody}>
              <p>{prayer.text}</p>
            </div>

            <div className={styles.cardFooter}>
              <button className={`${styles.actionBtn} ${prayer.status === 'Visto' ? styles.active : ''}`}>
                <CheckCircle size={18} /> {prayer.status === 'Visto' ? 'Orado' : 'Marcar como Orado'}
              </button>
              <button className={styles.deleteBtn} title="Remover">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
