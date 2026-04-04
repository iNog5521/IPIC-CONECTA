"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { CheckCircle, Trash2, MapPin, Search } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import ConfirmModal from "@/components/ConfirmModal";

export default function AdminOracoesPage() {
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de confirmação customizado
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    // Busca todos os pedidos, do mais recente para o mais antigo
    const q = query(collection(db, "oracoes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const pList: any[] = [];
      snapshot.forEach(d => pList.push({ id: d.id, ...d.data() }));
      setPrayers(pList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleToggleOrado = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Orado" ? "Pendente" : "Orado";
    try {
      await updateDoc(doc(db, "oracoes", id), { status: newStatus });
      toast.success(`Status alterado para: ${newStatus}`);
    } catch (e) {
      toast.error("Erro ao alterar status.");
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Pedido",
      message: "Tem certeza que deseja excluir permanentemente este pedido de oração?",
      isDestructive: true,
      confirmText: "Excluir",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "oracoes", id));
          toast.success("Pedido deletado com sucesso.");
        } catch (err) {
          toast.error("Erro ao deletar.");
        }
      }
    });
  };

  const filteredPrayers = prayers.filter(p => {
    const term = searchTerm.toLowerCase();
    const txt = p.texto?.toLowerCase() || "";
    const nm = p.nome?.toLowerCase() || "";
    return txt.includes(term) || nm.includes(term);
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Inbox de Orações</h1>
          <p className={styles.subtitle}>Acompanhe e interaja com os pedidos da comunidade.</p>
        </div>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar pedidos ou nomes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--primary)" }}>Carregando pedidos de oração...</div>
      ) : filteredPrayers.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Nenhum pedido encontrado.</div>
      ) : (
        <div className={styles.grid}>
          {filteredPrayers.map((prayer) => (
            <div key={prayer.id} className={styles.prayerCard}>
              <div className={styles.cardHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    {prayer.nome ? prayer.nome.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={styles.details}>
                    <span className={styles.name}>{prayer.nome || "Anônimo"}</span>
                    <span className={styles.sede}><MapPin size={12} /> {prayer.sede || "Não informada"}</span>
                  </div>
                </div>
                <span className={styles.date}>
                  {prayer.createdAt?.toDate ? prayer.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}
                </span>
              </div>
              
              <div className={styles.prayerBody}>
                <p>"{prayer.texto}"</p>
              </div>

              <div className={styles.cardFooter}>
                <button 
                  className={`${styles.actionBtn} ${prayer.status === 'Orado' ? styles.active : ''}`}
                  onClick={() => handleToggleOrado(prayer.id, prayer.status)}
                >
                  <CheckCircle size={18} /> {prayer.status === 'Orado' ? 'Marcado como Orado' : 'Marcar como Orado'}
                </button>
                <button 
                  className={styles.deleteBtn} 
                  title="Remover definitivamente"
                  onClick={() => handleDelete(prayer.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ConfirmModal para exclusões e ações críticas */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
