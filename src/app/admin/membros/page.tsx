import styles from "./page.module.css";
import { Search, Mail, Send, Filter, MoreVertical } from "lucide-react";

export default function AdminMembrosPage() {
  const MEMBROS = [
    { id: 1, name: "João Silva", email: "joao.silva@email.com", sede: "Sede Central", avatar: "JS" },
    { id: 2, name: "Maria Oliveira", email: "maria@email.com", sede: "Sede Norte", avatar: "MO" },
    { id: 3, name: "Carlos Souza", email: "carlos.s@email.com", sede: "Sede Sul", avatar: "CS" },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestão de Membros</h1>
          <p className={styles.subtitle}>Consulte a lista de fiéis e envie mensagens privadas.</p>
        </div>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Buscar membro por nome ou e-mail..." />
        </div>
      </header>

      <div className={styles.filters}>
        <button className={styles.filterBtn}><Filter size={16} /> Todas as Sedes</button>
        <button className={styles.filterBtn}>Fieis desde 2024</button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome / E-mail</th>
              <th>Sede</th>
              <th>Último Acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {MEMBROS.map((membro) => (
              <tr key={membro.id}>
                <td>
                  <div className={styles.memberCell}>
                    <div className={styles.avatar}>{membro.avatar}</div>
                    <div className={styles.memberInfo}>
                      <span className={styles.name}>{membro.name}</span>
                      <span className={styles.email}>{membro.email}</span>
                    </div>
                  </div>
                </td>
                <td>{membro.sede}</td>
                <td>Há 2 dias</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.msgBtn}>
                      <Send size={16} /> Mensagem
                    </button>
                    <button className={styles.moreBtn}><MoreVertical size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
