import styles from "./page.module.css";
import { Plus, Image as ImageIcon, Trash2, Edit2, MapPin } from "lucide-react";

export default function AdminMuralPage() {
  const AVISOS = [
    { id: 1, title: "Congresso de Mulheres 2026", sede: "Geral", status: "Publicado" },
    { id: 2, title: "Reunião de Líderes", sede: "Sede Norte", status: "Publicado" }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mural de Avisos</h1>
          <p className={styles.subtitle}>Gerencie o conteúdo que aparece na home do app.</p>
        </div>
        <button className={styles.newBtn}>
          <Plus size={18} /> Novo Aviso
        </button>
      </header>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Sede</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {AVISOS.map((aviso) => (
              <tr key={aviso.id}>
                <td className={styles.titleCell}>
                  <ImageIcon size={16} className={styles.fileIcon} />
                  {aviso.title}
                </td>
                <td>
                  <div className={styles.sedeBadge}>
                    <MapPin size={12} /> {aviso.sede}
                  </div>
                </td>
                <td><span className={styles.statusTag}>{aviso.status}</span></td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title="Editar"><Edit2 size={16} /></button>
                    <button className={`${styles.actionBtn} ${styles.delete}`} title="Excluir"><Trash2 size={16} /></button>
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
