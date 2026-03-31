import styles from "./page.module.css";
import { Send, Heart, History, Plus } from "lucide-react";

export default function OracoesPage() {
  const HISTORICO = [
    { id: 1, text: "Oração pela saúde da minha mãe que está no hospital.", status: "Em Oração", date: "Ontem" },
    { id: 2, text: "Gratidão pela nova oportunidade de emprego.", status: "Respondida", date: "25 Mar" }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Orações</h1>
        <p className={styles.subtitle}>Apresente seu pedido e vamos orar por você.</p>
      </header>

      <div className={styles.newRequestArea}>
        <div className={styles.inputCard}>
          <textarea 
            placeholder="Como podemos orar por você hoje?" 
            className={styles.textarea}
          ></textarea>
          <div className={styles.inputFooter}>
            <span className={styles.charCount}>0 / 500</span>
            <button className={styles.sendBtn}>
              <Send size={18} />
              Enviar Pedido
            </button>
          </div>
        </div>
      </div>

      <div className={styles.historyArea}>
        <div className={styles.historyHeader}>
          <History size={18} />
          <h2>Meus Pedidos</h2>
        </div>

        <div className={styles.historyList}>
          {HISTORICO.map((item) => (
            <div key={item.id} className={styles.historyCard}>
              <div className={styles.cardHeader}>
                <span className={styles.date}>{item.date}</span>
                <span className={`${styles.status} ${item.status === 'Respondida' ? styles.answered : styles.waiting}`}>
                  {item.status}
                </span>
              </div>
              <p className={styles.requestText}>{item.text}</p>
              <div className={styles.cardFooter}>
                <button className={styles.detailsBtn}>Ver detalhes</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão flutuante para scroll móvel */}
      <button className={styles.fab}>
        <Plus size={24} />
      </button>
    </div>
  );
}
