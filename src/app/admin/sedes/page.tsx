"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Plus, MapPin, Trash2, Edit2, X, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { toast } from "sonner";
import { Sede } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";



export default function AdminSedesPage() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [active, setActive] = useState(true);

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
    const q = query(collection(db, "sedes"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sede[];
      setSedes(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openModal = (sede?: Sede) => {
    if (sede) {
      setEditingSede(sede);
      setNome(sede.nome);
      setEndereco(sede.endereco);
      setActive(sede.active);
    } else {
      setEditingSede(null);
      setNome("");
      setEndereco("");
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSede(null);
    setNome("");
    setEndereco("");
    setActive(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Nome da sede é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (editingSede) {
        await updateDoc(doc(db, "sedes", editingSede.id), {
          nome: nome.trim(),
          endereco: endereco.trim(),
          active,
        });
        toast.success("Sede atualizada com sucesso!");
      } else {
        await addDoc(collection(db, "sedes"), {
          nome: nome.trim(),
          endereco: endereco.trim(),
          active: true,
          createdAt: new Date(),
        });
        toast.success("Sede criada com sucesso!");
      }
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar sede:", error);
      toast.error("Erro ao salvar sede.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (sede: Sede) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir a sede "${sede.nome}"? Esta ação não pode ser desfeita.`,
      isDestructive: true,
      confirmText: "Excluir Sede",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "sedes", sede.id));
          toast.success("Sede excluída.");
        } catch (error) {
          console.error("Erro ao excluir:", error);
          toast.error("Erro ao excluir sede.");
        }
      }
    });
  };

  const toggleActive = async (sede: Sede) => {
    try {
      await updateDoc(doc(db, "sedes", sede.id), {
        active: !sede.active,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Loader2 className="animate-spin" size={32} />
          <p>Carregando sedes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gerenciar Sedes</h1>
          <p className={styles.subtitle}>Adicione, edite ou desative sedes da igreja.</p>
        </div>
        <button className={styles.newBtn} onClick={() => openModal()}>
          <Plus size={18} /> Nova Sede
        </button>
      </header>

      <div className={styles.tableCard}>
        {sedes.length === 0 ? (
          <div className={styles.emptyState}>
            <MapPin size={48} strokeWidth={1} />
            <p>Nenhuma sede cadastrada.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sedes.map((sede) => (
                <tr key={sede.id}>
                  <td className={styles.titleCell}>
                    <MapPin size={16} style={{ marginRight: 8, color: 'var(--primary)' }} />
                    {sede.nome}
                  </td>
                  <td>{sede.endereco || "-"}</td>
                  <td>
                    <button
                      className={styles.statusToggle}
                      style={{ 
                        background: sede.active ? '#dcfce7' : '#fee2e2',
                        color: sede.active ? '#16a34a' : '#dc2626'
                      }}
                      onClick={() => toggleActive(sede)}
                    >
                      {sede.active ? "Ativa" : "Inativa"}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={`${styles.actionBtn} ${styles.edit}`} 
                        onClick={() => openModal(sede)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.delete}`} 
                        onClick={() => handleDelete(sede)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.modalTitle}>
                {editingSede ? "Editar Sede" : "Nova Sede"}
              </h2>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nome da Sede</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Ex: Sede Central"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Endereço</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Ex: Rua Principal, 100 - Centro"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                />
              </div>

              {editingSede && (
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                    />
                    Sede ativa
                  </label>
                </div>
              )}

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn} 
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : editingSede ? "Atualizar" : "Criar Sede"}
                </button>
              </div>
            </form>
          </div>
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