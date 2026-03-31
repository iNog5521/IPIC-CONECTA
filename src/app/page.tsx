import styles from "./page.module.css";
import { CheckCircle, Info, MessageSquare, MapPin } from "lucide-react";

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Dobra 1: Hero Section - Palavra do Dia */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Palavra do Dia</span>
            <h1 className={styles.heroText}>
              "O Senhor é o meu pastor e nada me faltará."
            </h1>
            <p className={styles.heroRef}>- Salmos 23:1</p>
          </div>
        </div>
      </section>

      <div className={styles.contentContainer}>
        {/* Ação de Presença */}
        <section className={styles.actionSection}>
          <button className={styles.presenceButton}>
            <CheckCircle size={20} />
            Confirmar Presença no Culto
          </button>
        </section>

        {/* Dobra 2: Portal de Avisos */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Info size={18} className={styles.sectionIcon} />
            <h2>Próximos Avisos</h2>
            <span className={styles.seeAll}>Ver todos</span>
          </div>
          
          <div className={styles.announcementList}>
            <div className={styles.announcementCard}>
              <div className={styles.announcementDate}>
                <span className={styles.day}>30</span>
                <span className={styles.month}>MAR</span>
              </div>
              <div className={styles.announcementInfo}>
                <h3>Culto de Jovens</h3>
                <p>Às 19h30 na Sede Central. Venha e participe!</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dobra 3: Pedidos & Sedes */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MessageSquare size={18} className={styles.sectionIcon} />
            <h2>Pedidos de Oração</h2>
          </div>
          <div className={styles.prayerCard}>
            <div className={styles.prayerImage}></div>
            <div className={styles.prayerContent}>
              <p>Compartilhe sua necessidade e nossa comunidade orará por você.</p>
              <button className={styles.prayerRequestButton}>
                Enviar novo pedido
              </button>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MapPin size={18} className={styles.sectionIcon} />
            <h2>Nossas Sedes</h2>
          </div>
          <div className={styles.sedesGrid}>
            <div className={styles.sedeCard}>
              <h4>Sede Central</h4>
              <p>Rua Principal, 100 - Centro</p>
            </div>
            <div className={styles.sedeCard}>
              <h4>Sede Norte</h4>
              <p>Avenida Norte, 500 - Bairro Novo</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
