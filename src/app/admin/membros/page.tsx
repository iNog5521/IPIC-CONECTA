"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Search, Send, Filter, ShieldCheck, ShieldAlert, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

export default function AdminMembrosPage() {
  const { user } = useAuth();
  const [membros, setMembros] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Controle de Modal de Mensagem
  const [selectedMembro, setSelectedMembro] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snapshot) => {
      const usersList: any[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setMembros(usersList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePromoteDemote = async (membroId: string, currentRole: string, email: string) => {
    if (email === "inog5521@gmail.com") {
      alert("Acesso Negado: A conta do Fundador é inalterável.");
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (confirm(`Atenção: Deseja alterar o cargo deste membro para ${newRole.toUpperCase()}?`)) {
      try {
        await updateDoc(doc(db, "users", membroId), { role: newRole });
      } catch (err) {
        alert("Erro ao alterar cargo.");
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMembro) return;
    setSendingMsg(true);
    try {
      await updateDoc(doc(db, "users", selectedMembro.id), {
        lastMessage: message,
        lastMessageDate: new Date().toLocaleDateString("pt-BR")
      });
      alert(`Mensagem enviada com sucesso para ${selectedMembro.nome}!`);
      setSelectedMembro(null);
      setMessage("");
    } catch (err) {
      alert("Erro ao enviar mensagem.");
    }
    setSendingMsg(false);
  };

  // Filtro
  const filteredMembros = membros.filter(m => {
    // Proteção de invisibilidade do Dolo: se não for o dono logado, esconde
    if (user?.email !== "inog5521@gmail.com" && m.email === "inog5521@gmail.com") return false;
    
    const term = searchTerm.toLowerCase();
    const nome = m.nome?.toLowerCase() || "";
    const email = m.email?.toLowerCase() || "";
    return nome.includes(term) || email.includes(term);
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestão de Membros</h1>
          <p className={styles.subtitle}>Gerencie papéis e envie comunicados privados Inbox.</p>
        </div>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar membro por nome ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className={styles.filters}>
        <button className={styles.filterBtn}><Filter size={16} /> Buscar em todas as Sedes</button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome / E-mail</th>
                <th>Sede</th>
                <th>Cargo / Nível</th>
                <th>Ações e Interações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>Carregando membros...</td>
                </tr>
              ) : filteredMembros.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>Nenhum membro encontrado.</td>
                </tr>
              ) : (
                filteredMembros.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className={styles.memberCell}>
                        <div className={styles.avatar}>
                          {m.nome ? m.nome.substring(0, 2).toUpperCase() : "US"}
                        </div>
                        <div className={styles.memberInfo}>
                          <span className={styles.name}>{m.nome} {m.email === "inog5521@gmail.com" && "👑"}</span>
                          <span className={styles.email}>{m.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{m.sede || "Não definida"}</td>
                    <td>
                      <span className={`${styles.roleTag} ${m.role === 'admin' || m.role === 'owner' ? styles.roleAdmin : ''}`}>
                        {m.role === 'owner' ? "Fundador" : m.role === 'admin' ? "Administrador" : "Fiel Autenticado"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={styles.msgBtn}
                          onClick={() => setSelectedMembro(m)}
                        >
                          <Send size={16} /> Enviar Inbox
                        </button>
                        
                        {m.email !== "inog5521@gmail.com" && (
                          <button 
                            className={`${styles.roleToggleBtn} ${m.role === 'admin' ? styles.despromove : ''}`}
                            onClick={() => handlePromoteDemote(m.id, m.role, m.email)}
                            title={m.role === 'admin' ? "Remover Cargo" : "Tornar Admin"}
                          >
                            {m.role === 'admin' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INBOX */}
      {selectedMembro && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Mensagem Direta</h2>
              <button 
                className={styles.closeModalBtn} 
                onClick={() => setSelectedMembro(null)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className={styles.modalForm}>
              <p className={styles.modalHint}>
                A mensagem será exibida na tela de Perfil do membro <strong>{selectedMembro.nome}</strong>, substituindo a mensagem anterior.
              </p>
              <textarea 
                className={styles.modalTextarea} 
                placeholder="Ex: Procure o conselho pastoral ao final do culto..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
              ></textarea>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setSelectedMembro(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.sendBtn} disabled={sendingMsg}>
                  {sendingMsg ? "Enviando..." : "Mandar Recado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
