"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Plus, Image as ImageIcon, Trash2, Edit2, MapPin, Upload, X, Loader2 } from "lucide-react";
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


interface Aviso {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  sede: string;
  imageUrl: string;
  storagePath: string;
  createdAt: any;
}

interface Sede {
  id: string;
  nome: string;
  endereco: string;
  active: boolean;
}

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
      alert("Por favor, preencha todos os campos e selecione uma imagem.");
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
      alert("Aviso publicado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar aviso:", error);
      let msg = "Erro ao salvar o aviso. Tente novamente.";
      if (error.message) {
        msg = `Erro: ${error.message}`;
      }
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (aviso: Aviso) => {
    if (!confirm("Tem certeza que deseja excluir este aviso?")) return;

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
      console.log("Exclusão concluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir aviso:", error);
      alert("Erro ao excluir aviso.");
    }
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
                  <select className={styles.select} value={sede} onChange={(e) => setSede(e.target.value)}>
                    <option value="Geral">Geral (Todos)</option>
                    {sedes.map((s) => (
                      <option key={s.id} value={s.nome}>{s.nome}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Categoria</label>
                  <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Eventos">Eventos</option>
                    <option value="Social">Social</option>
                    <option value="Liderança">Liderança</option>
                    <option value="Aviso">Aviso</option>
                    <option value="Outros">Outros</option>
                  </select>
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
    </div>
  );
}
