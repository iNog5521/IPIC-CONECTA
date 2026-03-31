import styles from "./page.module.css";
import { Bell, ChevronRight, Clock, Calendar } from "lucide-react";

const AVISOS_MOCK = [
  {
    id: 1,
    title: "Congresso de Mulheres 2026",
    excerpt: "Inscrições abertas para o congresso anual que ocorrerá em Maio.",
    date: "15 Mai",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Eventos"
  },
  {
    id: 2,
    title: "Nova Campanha de Doação",
    excerpt: "Estamos arrecadando alimentos para as famílias da comunidade local.",
    date: "31 Mar",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Social"
  },
  {
    id: 3,
    title: "Reunião de Líderes",
    excerpt: "Encontro mensal para planejamento do próximo trimestre.",
    date: "05 Abr",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Liderança"
  }
];

export default function MuralPage() {
  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Mural de Avisos</h1>
        <p className={styles.subtitle}>Fique por dentro das novidades da nossa comunidade.</p>
      </header>

      <div className={styles.feed}>
        {AVISOS_MOCK.map((aviso) => (
          <div key={aviso.id} className={styles.avisoCard}>
            <div 
              className={styles.avisoImage} 
              style={{ backgroundImage: `url(${aviso.image})` }}
            >
              <span className={styles.categoryBadge}>{aviso.category}</span>
            </div>
            <div className={styles.avisoInfo}>
              <div className={styles.dateInfo}>
                <Calendar size={14} />
                <span>{aviso.date}</span>
              </div>
              <h2 className={styles.avisoTitle}>{aviso.title}</h2>
              <p className={styles.avisoExcerpt}>{aviso.excerpt}</p>
              <div className={styles.cardFooter}>
                <button className={styles.readMore}>
                  Ler mais <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
