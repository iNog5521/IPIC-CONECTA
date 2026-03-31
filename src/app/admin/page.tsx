import styles from "./page.module.css";
import { 
  Users, 
  Heart, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  ArrowRight
} from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { label: "Membros Ativos", value: "1.240", icon: Users, color: "#1B3B36" },
    { label: "Pedidos de Oração", value: "48", icon: Heart, color: "#EF4444" },
    { label: "Presenças Confirmadas", value: "312", icon: Calendar, color: "#D4AF37" },
    { label: "Mensagens Enviadas", value: "856", icon: MessageSquare, color: "#1FAA5B" },
  ];

  return (
    <div className={styles.container}>
      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
            </div>
            <div 
              className={styles.statIcon} 
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
            >
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        {/* Recentes Pedidos de Oração */}
        <section className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <h2>Pedidos de Oração Recentes</h2>
            <button className={styles.viewMore}>Ver todos <ArrowRight size={16} /></button>
          </div>
          <div className={styles.listCard}>
            <div className={styles.listItem}>
              <div className={styles.listInfo}>
                <span className={styles.listTitle}>Maria Oliveira</span>
                <span className={styles.listSubtitle}>Sede Central • Saúde e Família</span>
              </div>
              <span className={styles.tag}>Pendente</span>
            </div>
            <div className={styles.listItem}>
              <div className={styles.listInfo}>
                <span className={styles.listTitle}>Carlos Medeiros</span>
                <span className={styles.listSubtitle}>Sede Norte • Emprego</span>
              </div>
              <span className={styles.tag}>Pendente</span>
            </div>
          </div>
        </section>

        {/* Atividade da Comunidade */}
        <section className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <h2>Atividade da Comunidade</h2>
          </div>
          <div className={styles.activityCard}>
            <div className={styles.chartPlaceholder}>
              <TrendingUp size={48} className={styles.chartIcon} />
              <p>Gráfico de Engajamento Semanal</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
