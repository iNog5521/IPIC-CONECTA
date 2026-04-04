"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Plus, Image as ImageIcon, Trash2, Edit2, MapPin, Upload, X, Loader2, ChevronDown, Check, Lock } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDoc, 
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
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

  // 1. Verificação de Autenticação e Cargo (Smart Loading)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          console.log("[DEBUG] Autenticado com UID:", user.uid);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            console.log("[DEBUG] Cargo encontrado no banco:", role);
            
            if (role === 'admin' || role === 'owner') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
              toast.error("Acesso negado: Seu perfil não é Admin.");
            }
          } else {
            console.warn("[DEBUG] Perfil não encontrado no Firestore para este UID.");
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("[DEBUG] Erro ao buscar perfil:", error);
          setIsAdmin(false);
        }
      } else {
        console.log("[DEBUG] Nenhum usuário logado.");
        setIsAdmin(false);
      }
      setTimeout(() => setAuthLoading(false), 500);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Listeners de Dados (Só começam após ser confirmado como Admin)
  useEffect(() => {
    if (!db || !isAdmin || authLoading) return;

    // Listeners padrão
    const qSedes = query(collection(db, "sedes"));
    const unsubSedes = onSnapshot(qSedes, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sede[];
      setSedes(docs.filter((s: Sede) => s.active));
    });

    const qAvisos = query(collection(db, "avisos"), orderBy("createdAt", "desc"));
    const unsubAvisos = onSnapshot(qAvisos, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Aviso[];
      setAvisos(docs);
      setLoading(false);
    }, (error) => {
      console.warn("Erro no listener de Avisos:", error);
    });

    const qModelos = query(collection(db, "modelos_mural"), orderBy("createdAt", "desc"));
    const unsubModelos = onSnapshot(qModelos, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModeloMural[];
      setModelos(docs);
    }, (error) => {
      console.error("Erro no listener de Modelos (Templates):", error);
    });

    return () => {
      unsubSedes();
      unsubAvisos();
      unsubModelos();
    };
  }, [isAdmin, authLoading]);

  // Click outside para dropdowns
  useEffect(() => {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedModelo(null);
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
    if (!isAdmin) {
      toast.error("O sistema bloqueou a ação: Você não é Admin.");
      return;
    }
    if (!modeloName || !modeloFile) {
      toast.error("Preencha o nome e selecione uma imagem.");
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

      if (!response.ok) throw new Error("Erro no upload do arquivo.");
      
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
      toast.success("Modelo salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar no Firestore:", error);
      if (error.code === 'permission-denied') {
        toast.error("O Banco de Dados recusou sua permissão (Regra de Segurança).");
      } else {
        toast.error("Erro ao salvar modelo. Verifique sua conexão.");
      }
    } finally {
      setSavingModelo(false);
    }
  };

  const handleDeleteModelo = (modelo: ModeloMural) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Modelo",
      message: `Deseja apagar "${modelo.name}"?`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          if (modelo.storagePath) {
            await fetch(`/api/upload?path=${encodeURIComponent(modelo.storagePath)}`, {
              method: "DELETE",
            });
          }
          await deleteDoc(doc(db, "modelos_mural", modelo.id));
          toast.success("Modelo removido.");
        } catch (error) {
          toast.error("Erro ao remover modelo.");
        }
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    if (!title || !excerpt || (!imageFile && !selectedModelo)) {
      toast.error("Faltam informações para publicar.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = "";
      let storagePath = "";
      
      if (selectedModelo) {
        imageUrl = selectedModelo.imageUrl;
      } else if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("folder", "avisos");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("Falha ao fazer upload");

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
        storagePath = uploadData.path;
      }

      await addDoc(collection(db, "avisos"), {
        title,
        excerpt,
        category,
        sede,
        imageUrl,
        storagePath,
        createdAt: serverTimestamp(),
      });

      setIsModalOpen(false);
      resetForm();
      toast.success("Aviso publicado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar aviso:", error);
      toast.error("Erro de permissão ou conexão ao gravar o aviso.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (aviso: Aviso) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmar Exclusão",
      message: `Apagar "${aviso.title}"?`,
      isDestructive: true,
      confirmText: "Deletar",
      onConfirm: async () => {
        try {
          if (aviso.storagePath) {
            await fetch(`/api/upload?path=${encodeURIComponent(aviso.storagePath)}`, {
              method: "DELETE",
            });
          }
          await deleteDoc(doc(db, "avisos", aviso.id));
          toast.success("Aviso removido.");
        } catch (error) {
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

  // UI: Carregamento
  if (authLoading) {
    return (
      <div className={styles.container} style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={56} color="var(--primary)" />
          <p style={{ marginTop: '1.5rem', fontWeight: '800', color: 'var(--text-muted)' }}>Sincronizando Permissões Admin...</p>
        </div>
      </div>
    );
  }

  // UI: Acesso Negado
  if (!isAdmin) {
    return (
      <div className={styles.container} style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '3.5rem', borderRadius: '32px', boxShadow: 'var(--shadow-lg)' }}>
          <Lock size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Acesso Restrito</h2>
          <p style={{ color: 'var(--text-muted)' }}>Você não é um Administrador cadastrado no sistema.</p>
          <button onClick={() => window.location.href = '/'} style={{ marginTop: '2rem', background: 'var(--primary)', color: 'white', padding: '0.75rem 2.5rem', borderRadius: '14px', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Voltar ao Início</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mural de Avisos</h1>
          <p className={styles.subtitle}>Gerencie o conteúdo que aparece na home do app.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
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
            <p>Carregando Mural...</p>
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
                      <img src={aviso.imageUrl} alt={aviso.title} className={styles.fileIcon} style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover' }} />
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

      {/* Modais omitidos no resumo para brevidade, mas funcionais */}
      {/* Modal de Modelos (Templates) */}
      {isModelosModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className={styles.modalTitle}>Templates de Mural</h2>
              <button onClick={() => setIsModelosModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveModelo} style={{ marginBottom: '2rem', padding: '1.25rem', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '1rem' }}>Novo Template</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', alignItems: 'end' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label>Título</label>
                  <input type="text" className={styles.input} placeholder="Ex: Culto Jovem" value={modeloName} onChange={(e) => setModeloName(e.target.value)} />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <input type="file" id="modeloUpload" hidden accept="image/*" onChange={handleModeloImageChange} />
                  <label htmlFor="modeloUpload" className={styles.imageUpload} style={{ height: '44px', minHeight: 'auto', padding: '0 1rem' }}>
                    {modeloPreview ? "Foto Pronta ✓" : "Upload Imagem"}
                  </label>
                </div>
              </div>
              <button type="submit" className={styles.saveBtn} style={{ width: '100%', marginTop: '1rem' }} disabled={savingModelo}>
                {savingModelo ? "Salvando..." : "Salvar Template"}
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.25rem', maxHeight: '420px', overflowY: 'auto' }}>
              {modelos.map((m) => (
                <div key={m.id} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={m.imageUrl} alt={m.name} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  <div style={{ padding: '0.5rem', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>{m.name}</span>
                    <button onClick={() => handleDeleteModelo(m)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Aviso */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className={styles.modalTitle}>Publicar no Mural</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Título</label>
                <input type="text" className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className={styles.formGroup}>
                <label>Resumo</label>
                <textarea className={styles.textarea} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className={styles.formGroup}>
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
                <div className={styles.formGroup}>
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
                <label>Imagem ou Template</label>
                {modelos.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                    {modelos.map((m) => (
                      <div key={m.id} onClick={() => setSelectedModelo(m)} style={{ flex: '0 0 80px', cursor: 'pointer', border: selectedModelo?.id === m.id ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={m.imageUrl} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" id="imageUpload" hidden accept="image/*" onChange={handleImageChange} />
                <label htmlFor="imageUpload" className={styles.imageUpload}>
                  {selectedModelo ? `Modelo: ${selectedModelo.name}` : imagePreview ? "Avatar Carregado" : "Upload de Imagem"}
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? "Publicando..." : "Publicar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
        onConfirm={confirmModal.onConfirm} 
      />
    </div>
  );
}
