"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Plus, Image as ImageIcon, Trash2, Edit2, MapPin, Upload, X, Loader2, ChevronDown, Check } from "lucide-react";
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
import { Sede, Aviso, ModeloMural } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";



export default function AdminMuralPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [modelos, setModelos] = useState<ModeloMural[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModelosModalOpen, setIsModelosModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State para Aviso
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("Geral");
  const [sede, setSede] = useState("Geral");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedModelo, setSelectedModelo] = useState<ModeloMural | null>(null);
  const [showSedeDropdown, setShowSedeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Form State para Modelos
  const [modeloName, setModeloName] = useState("");
  const [modeloFile, setModeloFile] = useState<File | null>(null);
  const [modeloPreview, setModeloPreview] = useState<string | null>(null);
  const [savingModelo, setSavingModelo] = useState(false);

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

    const qModelos = query(collection(db, "modelos_mural"), orderBy("createdAt", "desc"));
    const unsubModelos = onSnapshot(qModelos, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModeloMural[];
      setModelos(docs);
    });

    return () => {
      unsubSedes();
      unsubscribe();
      unsubModelos();
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedModelo(null); // Desmarca modelo se subir manual
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModeloImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setModeloFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setModeloPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveModelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modeloName || !modeloFile) {
      toast.error("Preencha o nome e selecione uma imagem para o modelo.");
      return;
    }

    setSavingModelo(true);
    try {
      const formData = new FormData();
      formData.append("file", modeloFile);
      formData.append("folder", "modelos-mural");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro no upload do modelo");
      
      const data = await response.json();

      await addDoc(collection(db, "modelos_mural"), {
        name: modeloName,
        imageUrl: data.url,
        storagePath: data.path,
        createdAt: serverTimestamp(),
      });

      setModeloName("");
      setModeloFile(null);
      setModeloPreview(null);
      toast.success("Modelo adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast.error("Erro ao salvar modelo.");
    } finally {
      setSavingModelo(false);
    }
  };

  const handleDeleteModelo = (modelo: ModeloMural) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Modelo",
      message: `Tem certeza que deseja excluir o modelo "${modelo.name}"? Isso não afetará avisos já criados com ele.`,
      isDestructive: true,
      confirmText: "Excluir Modelo",
      onConfirm: async () => {
        try {
          if (modelo.storagePath) {
            await fetch(`/api/upload?path=${encodeURIComponent(modelo.storagePath)}`, {
              method: "DELETE",
            });
          }
          await deleteDoc(doc(db, "modelos_mural", modelo.id));
          toast.success("Modelo excluído!");
        } catch (error) {
          console.error("Erro ao excluir modelo:", error);
          toast.error("Erro ao excluir modelo.");
        }
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Agora aceita OU imagem OU modelo selecionado
    if (!title || !excerpt || (!imageFile && !selectedModelo)) {
      toast.error("Por favor, preencha todos os campos e selecione uma imagem ou modelo.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = "";
      let storagePath = "";
      
      if (selectedModelo) {
        imageUrl = selectedModelo.imageUrl;
        storagePath = ""; // Não definimos storagePath para avisos com modelo para não deletarmos o modelo por engano ao deletar o aviso
      } else if (imageFile) {
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
          // 1. Delete from Storage via API (apenas se for upload manual, indicado por ter storagePath)
          if (aviso.storagePath) {
            await fetch(`/api/upload?path=${encodeURIComponent(aviso.storagePath)}`, {
              method: "DELETE",
            }).catch(err => console.warn("Erro ao deletar arquivo do storage:", err));
          }

          // 2. Delete from Firestore
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
    setSelectedModelo(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mural de Avisos</h1>
          <p className={styles.subtitle}>Gerencie o conteúdo que aparece na home do app.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className={styles.newBtn} 
            onClick={() => setIsModelosModalOpen(true)}
            style={{ background: 'var(--text-muted)', color: 'white' }}
          >
            <ImageIcon size={18} /> Modelos
          </button>
          <button className={styles.newBtn} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Novo Aviso
          </button>
        </div>
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

      {/* Modal de Gerenciar Modelos */}
      {isModelosModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.modalTitle}>Gerenciar Modelos (Templates)</h2>
              <button onClick={() => setIsModelosModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveModelo} style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem' }}>Adicionar Novo Modelo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label>Nome do Modelo</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="Ex: Oração da Noite"
                    value={modeloName}
                    onChange={(e) => setModeloName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <input type="file" id="modeloUpload" hidden accept="image/*" onChange={handleModeloImageChange} />
                  <label htmlFor="modeloUpload" className={styles.imageUpload} style={{ height: '42px', minHeight: 'auto', padding: '0 1rem' }}>
                    {modeloPreview ? "Imagem Selecionada" : "Selecionar Imagem"}
                  </label>
                </div>
              </div>
              <button 
                type="submit" 
                className={styles.saveBtn} 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={savingModelo}
              >
                {savingModelo ? "Enviando..." : "Salvar Modelo"}
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
              {modelos.length === 0 ? (
                <p style={{ textAlign: 'center', gridColumn: '1/-1', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum modelo cadastrado.
                </p>
              ) : (
                modelos.map((m) => (
                  <div key={m.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={m.imageUrl} alt={m.name} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                    <div style={{ padding: '0.5rem', background: 'white' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                      <button 
                        onClick={() => handleDeleteModelo(m)}
                        style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label>Sede</label>
                  <div className={`${styles.customSelect} customSelect`}>
                    <button type="button" className={styles.selectBtn} onClick={() => setShowSedeDropdown(!showSedeDropdown)}>{sede} <ChevronDown size={16} /></button>
                    {showSedeDropdown && (
                      <div className={styles.selectMenu}>
                        <button type="button" className={styles.selectItem} onClick={() => { setSede("Geral"); setShowSedeDropdown(false); }}>Geral</button>
                        {sedes.map((s) => (
                          <button key={s.id} type="button" className={styles.selectItem} onClick={() => { setSede(s.nome); setShowSedeDropdown(false); }}>{s.nome}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label>Categoria</label>
                  <div className={`${styles.customSelect} customSelect`}>
                    <button type="button" className={styles.selectBtn} onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>{category} <ChevronDown size={16} /></button>
                    {showCategoryDropdown && (
                      <div className={styles.selectMenu}>
                        {["Eventos", "Social", "Liderança", "Aviso", "Outros"].map((cat) => (
                          <button key={cat} type="button" className={styles.selectItem} onClick={() => { setCategory(cat); setShowCategoryDropdown(false); }}>{cat}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Imagem de Capa
                  {modelos.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700' }}>ESCOLHA UM MODELO ABAIXO OU FAÇA UPLOAD</span>}
                </label>

                {/* Seletor de Modelos */}
                {modelos.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.5rem 0', marginBottom: '1rem', scrollbarWidth: 'none' }}>
                    {modelos.map((m) => (
                      <div 
                        key={m.id} 
                        onClick={() => { setSelectedModelo(m); setImageFile(null); setImagePreview(null); }}
                        style={{ 
                          flex: '0 0 100px', cursor: 'pointer', position: 'relative', borderRadius: '8px', overflow: 'hidden', 
                          border: selectedModelo?.id === m.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                          transform: selectedModelo?.id === m.id ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s'
                        }}
                      >
                        <img src={m.imageUrl} alt={m.name} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                        {selectedModelo?.id === m.id && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check color="white" size={24} />
                          </div>
                        )}
                        <span style={{ fontSize: '10px', padding: '2px 4px', display: 'block', textAlign: 'center', background: 'white' }}>{m.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <input type="file" id="imageUpload" hidden accept="image/*" onChange={handleImageChange} />
                <label htmlFor="imageUpload" className={styles.imageUpload} style={{ borderStyle: selectedModelo ? 'solid' : 'dashed', borderColor: selectedModelo ? 'var(--primary)' : 'var(--border)' }}>
                  {selectedModelo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                      <img src={selectedModelo.imageUrl} alt="Selected" className={styles.preview} style={{ width: 80, height: 45, borderRadius: 4 }} />
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>Modelo: {selectedModelo.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clique para trocar por imagem manual</p>
                      </div>
                    </div>
                  ) : imagePreview ? (
                    <img src={imagePreview} alt="Preview" className={styles.preview} />
                  ) : (
                    <>
                      <Upload size={24} />
                      <span>Selecione uma imagem ou use um modelo acima</span>
                    </>
                  )}
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? "Publicar pelo modelo..." : "Publicar Aviso"}
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
