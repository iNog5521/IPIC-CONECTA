"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { Search, Send, Filter, ShieldCheck, ShieldAlert, X, MessageSquare, Trash2, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, where, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { Sede, UserProfile } from "@/types";



interface MensagemAdmin {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  mensagem: string;
  data: any;
  lida: boolean;
  deletedAt?: any;
}

export default function AdminMembrosPage() {
  const { user } = useAuth();
  const [membros, setMembros] = useState<UserProfile[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sedeSelecionada, setSedeSelecionada] = useState("todas");
  const [loading, setLoading] = useState(true);

  // Controle de Modal de Mensagem
  const [selectedMembro, setSelectedMembro] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Histórico de mensagens
  const [showHistory, setShowHistory] = useState(false);
  const [mensagensEnviadas, setMensagensEnviadas] = useState<MensagemAdmin[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setMembros(usersList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "sedes"), where("active", "==", true));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sede[];
      setSedes(docs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!showHistory) return;
    setLoadingHistory(true);
    const q = query(collection(db, "mensagens_admin"), orderBy("data", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MensagemAdmin[];
      setMensagensEnviadas(msgs);
      setLoadingHistory(false);
    });
    return () => unsub();
  }, [showHistory]);

  const handlePromoteDemote = async (membroId: string, currentRole: string, email: string) => {
    if (email === "inog5521@gmail.com") {
      toast.error("Acesso Negado: A conta do Fundador é inalterável.");
      return;
    }
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (confirm(`Atenção: Deseja alterar o cargo deste membro para ${newRole.toUpperCase()}?`)) {
      try {
        await updateDoc(doc(db, "users", membroId), { role: newRole });
        toast.success(`Cargo alterado para ${newRole.toUpperCase()}`);
      } catch (err) {
        toast.error("Erro ao alterar cargo.");
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMembro) return;
    setSendingMsg(true);
    try {
      // Salva no histórico independente do usuário
      await addDoc(collection(db, "mensagens_admin"), {
        userId: selectedMembro.id,
        userName: selectedMembro.nome,
        userEmail: selectedMembro.email,
        mensagem: message,
        data: new Date(),
        lida: false
      });

      // Atualiza lastMessage no perfil do usuário
      await updateDoc(doc(db, "users", selectedMembro.id), {
        lastMessage: message,
        lastMessageDate: new Date().toLocaleDateString("pt-BR")
      });
      toast.success(`Mensagem enviada para ${selectedMembro.nome}!`);
      setSelectedMembro(null);
      setMessage("");
    } catch (err) {
      toast.error("Erro ao enviar mensagem.");
    }
    setSendingMsg(false);
  };

  const handleDeleteMensagem = async (msgId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta mensagem do histórico?")) return;
    try {
      await deleteDoc(doc(db, "mensagens_admin", msgId));
      toast.success("Mensagem removida do histórico.");
    } catch (err) {
      toast.error("Erro ao excluir mensagem.");
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm("ATENÇÃO: Isso excluirá TODAS as mensagens do histórico. Continuar?")) return;
    try {
      for (const msg of mensagensEnviadas) {
        await deleteDoc(doc(db, "mensagens_admin", msg.id));
      }
      toast.success("Histórico limpo com sucesso.");
    } catch (err) {
      toast.error("Erro ao limpar histórico.");
    }
  };

  const handleDeleteUser = async (membroId: string, membroEmail: string, membroNome: string) => {
    if (membroEmail === "inog5521@gmail.com") {
      toast.error("Acesso Negado: O fundador não pode ser excluído.");
      return;
    }
    
    if (!confirm(`⚠️ ATENÇÃO!\n\nVocê está prestes a excluir o usuário:\n\n${membroNome} (${membroEmail})\n\nEsta ação é IRREVERSÍVEL! Todos os dados deste usuário serão apagados.\n\nTem certeza que deseja continuar?`)) {
      return;
    }

    try {
      // First delete from Auth via API
      const response = await fetch(`/api/delete-user?userId=${membroId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Erro ao excluir do Auth:", error);
      }

      // Then delete from Firestore
      await deleteDoc(doc(db, "users", membroId));
      
      toast.success("Usuário excluído com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir usuário.");
    }
  };

  // Filtro
  const filteredMembros = membros.filter(m => {
    // Proteção de invisibilidade do Dolo: se não for o dono logado, esconde
    if (user?.email !== "inog5521@gmail.com" && m.email === "inog5521@gmail.com") return false;
    
    const term = searchTerm.toLowerCase();
    const nome = m.nome?.toLowerCase() || "";
    const email = m.email?.toLowerCase() || "";

    // Filtro por sede
    const matchesSede = sedeSelecionada === "todas" || !m.sede || m.sede === sedeSelecionada || m.sede === "Geral";

    return (nome.includes(term) || email.includes(term)) && matchesSede;
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
        <div className={styles.filterWrapper}>
          <div className={styles.filterDropdown}>
            <button 
              className={`${styles.filterBtn} ${styles.activeFilter}`}
              onClick={() => {
                const dropdown = document.getElementById('sedeDropdown');
                dropdown?.classList.toggle(styles.show);
              }}
            >
              <Filter size={16} /> {sedeSelecionada === "todas" ? "Todas as Sedes" : sedeSelecionada} <ChevronDown size={16} />
            </button>
            <div id="sedeDropdown" className={styles.dropdownMenu}>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setSedeSelecionada("todas");
                  document.getElementById('sedeDropdown')?.classList.remove(styles.show);
                }}
              >
                Todas as Sedes
              </button>
              {sedes.map((sede) => (
                <button
                  key={sede.id}
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSedeSelecionada(sede.nome);
                    document.getElementById('sedeDropdown')?.classList.remove(styles.show);
                  }}
                >
                  {sede.nome}
                </button>
              ))}
            </div>
          </div>
          <button 
            className={styles.filterBtn}
            onClick={() => setShowHistory(true)}
          >
            <MessageSquare size={16} /> Histórico
          </button>
        </div>
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
                          <span className={styles.name}>
                            {m.nome || "Sem nome"} {m.email === "inog5521@gmail.com" && "👑"}
                          </span>
                          <span className={styles.email}>{m.email || "Sem e-mail"}</span>
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
                        
                        {m.email !== "inog5521@gmail.com" && (
                          <button 
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteUser(m.id, m.email, m.nome)}
                            title="Excluir Usuário"
                          >
                            <Trash2 size={18} />
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
                A mensagem será exibida na tela de Perfil do membro <strong>{selectedMembro.nome}</strong>, e salva no histórico.
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

      {/* MODAL HISTÓRICO DE MENSAGENS */}
      {showHistory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '600px', maxHeight: '80vh' }}>
            <div className={styles.modalHeader}>
              <h2>Histórico de Mensagens Enviadas</h2>
              <button 
                className={styles.closeModalBtn} 
                onClick={() => setShowHistory(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {mensagensEnviadas.length} mensagem(ns) no histórico
              </span>
              {mensagensEnviadas.length > 0 && (
                <button 
                  onClick={handleClearAllHistory}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Trash2 size={14} /> Limpar Tudo
                </button>
              )}
            </div>
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {loadingHistory ? (
                <p style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</p>
              ) : mensagensEnviadas.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Nenhuma mensagem enviada ainda.
                </p>
              ) : (
                mensagensEnviadas.map((msg) => (
                  <div key={msg.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: msg.lida ? 'white' : '#f0f9ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>{msg.userName}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{msg.userEmail}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteMensagem(msg.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="Excluir mensagem"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                      {msg.mensagem}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {msg.data?.toDate ? msg.data.toDate().toLocaleDateString("pt-BR") + " " + msg.data.toDate().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
