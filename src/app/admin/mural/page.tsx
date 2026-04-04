"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Plus, Image as ImageIcon, Trash2, Edit2, MapPin, Upload, X, Loader2, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { toast } from "sonner";
import { Sede, Aviso } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";



export default function AdminMuralPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("Geral");
  const [sede, setSede] = useState("Geral");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSedeDropdown, setShowSedeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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
    if (!db) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.customSelect')) {
        setShowSedeDropdown(false);
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!db) return;

    const qSedes = query(collection(db, "sedes"));
    const unsubSedes = onSnapshot(qSedes, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sede[];
      setSedes(docs.filter((s: Sede) => s.active));
    });

    const q = query(collection(db, "avisos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Aviso[];
      setAvisos(docs);
      setLoading(false);
    });

    return () => {
      unsubSedes();
      unsubscribe();
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Arquivo selecionado:", file.name, file.size, file.type);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !excerpt || !imageFile) {
      toast.error("Por favor, preencha todos os campos e selecione uma imagem.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = "";
      let storagePath = "";
      
      // 1. Upload Image via API (evita CORS)
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("folder", "avisos");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Falha ao fazer upload da imagem");
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
        storagePath = uploadData.path;
      }

      // 2. Save to Firestore
      await addDoc(collection(db, "avisos"), {
        title,
        excerpt,
        category,
        sede,
        imageUrl,
        storagePath,
        createdAt: serverTimestamp(),
      });

      // Reset & Close
      setIsModalOpen(false);
      resetForm();
      toast.success("Aviso publicado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar aviso:", error);
      const msg = error.message ? `Erro: ${error.message}` : "Erro ao salvar o aviso.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (aviso: Aviso) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir o aviso "${aviso.title}"? Esta ação não pode ser desfeita.`,
      isDestructive: true,
      confirmText: "Excluir Aviso",
      onConfirm: async () => {
        try {
          console.log("Iniciando exclusão do aviso:", aviso.id);
          
          // 1. Delete from Storage via API
          if (aviso.storagePath) {
            console.log("Excluindo arquivo do Storage:", aviso.storagePath);
            await fetch(`/api/upload?path=${encodeURIComponent(aviso.storagePath)}`, {
              method: "DELETE",
            }).catch(err => console.warn("Erro ao deletar arquivo do storage:", err));
          }

          // 2. Delete from Firestore
          console.log("Excluindo documento do Firestore:", aviso.id);
          await deleteDoc(doc(db, "avisos", aviso.id));
          toast.success("Aviso excluído!");
        } catch (error) {
          console.error("Erro ao excluir aviso:", error);
          toast.error("Erro ao excluir aviso.");
        }
      }
    });
  };

  const resetForm = () => {
    setTitle("");
    setExcerpt("");
    setCategory("Geral");
    setSede("Geral");
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mural de Avisos</h1>
          <p className={styles.subtitle}>Gerencie o conteúdo que aparece na home do app.</p>
        </div>
        <button className={styles.newBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Aviso
        </button>
      </header>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>
            <Loader2 className="animate-spin" size={32} />
            <p>Carregando avisos...</p>
          </div>
        ) : avisos.length === 0 ? (
          <div className={styles.emptyState}>
            <ImageIcon size={48} strokeWidth={1} />
            <p>Nenhum aviso publicado ainda.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Sede</th>
                <th>Categoria</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {avisos.map((aviso) => (
                <tr key={aviso.id}>
                  <td className={styles.titleCell}>
                    {aviso.imageUrl ? (
                      <img src={aviso.imageUrl} alt={aviso.title} className={styles.fileIcon} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={16} className={styles.fileIcon} />
                    )}
                    {aviso.title}
                  </td>
                  <td>
                    <div className={styles.sedeBadge}>
                      <MapPin size={12} /> {aviso.sede}
                    </div>
                  </td>
                  <td><span className={styles.statusTag}>{aviso.category}</span></td>
                  <td>
                    <div className={styles.actions}>
                      <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => handleDelete(aviso)} title="Excluir">
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

      {/* Modal de Novo Aviso */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.modalTitle}>Novo Aviso</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Título do Aviso</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Ex: Congresso de Mulheres"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Resumo / Descrição curta</label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Breve descrição do aviso..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Sede</label>
                  <div className={`${styles.customSelect} customSelect`}>
                    <button 
                      type="button"
                      className={styles.selectBtn}
                      onClick={() => setShowSedeDropdown(!showSedeDropdown)}
                    >
                      {sede} <ChevronDown size={16} />
                    </button>
                    {showSedeDropdown && (
                      <div className={styles.selectMenu}>
                        <button
                          type="button"
                          className={styles.selectItem}
                          onClick={() => { setSede("Geral"); setShowSedeDropdown(false); }}
                        >
                          Geral (Todos)
                        </button>
                        {sedes.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className={styles.selectItem}
                            onClick={() => { setSede(s.nome); setShowSedeDropdown(false); }}
                          >
                            {s.nome}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Categoria</label>
                  <div className={`${styles.customSelect} customSelect`}>
                    <button 
                      type="button"
                      className={styles.selectBtn}
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    >
                      {category} <ChevronDown size={16} />
                    </button>
                    {showCategoryDropdown && (
                      <div className={styles.selectMenu}>
                        {["Eventos", "Social", "Liderança", "Aviso", "Outros"].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className={styles.selectItem}
                            onClick={() => { setCategory(cat); setShowCategoryDropdown(false); }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Imagem de Capa</label>
                <input 
                  type="file" 
                  id="imageUpload" 
                  hidden 
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <label htmlFor="imageUpload" className={styles.imageUpload}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className={styles.preview} />
                  ) : (
                    <>
                      <Upload size={24} />
                      <span>Selecione uma imagem (Recomendado 16:9)</span>
                    </>
                  )}
                </label>
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn} 
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Publicar Aviso"}
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
