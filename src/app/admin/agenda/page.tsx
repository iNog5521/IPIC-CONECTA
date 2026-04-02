"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Calendar, Clock, MapPin, Users, Plus, Trash2, Edit2, X, Loader2, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

interface Culto {
  id: string;
  name: string;
  description: string;
  day: string;
  time: string;
  sede: string;
  active: boolean;
}

interface Confirmacao {
  id: string;
  cultoId: string;
  cultoTime?: string;
  cultoDay?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  sede?: string;
  createdAt: any;
}

interface Sede {
  id: string;
  nome: string;
  endereco: string;
  active: boolean;
}

const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export default function AdminAgendaPage() {
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [confirmacoes, setConfirmacoes] = useState<Confirmacao[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"cultos" | "confirmacoes">("cultos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCulto, setEditingCulto] = useState<Culto | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState("Domingo");
  const [time, setTime] = useState("09:00");
  const [sede, setSede] = useState("Geral");
  const [active, setActive] = useState(true);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showSedeDropdown, setShowSedeDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.customSelect')) {
        setShowDayDropdown(false);
        setShowSedeDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const qSedes = query(collection(db, "sedes"));
    const unsubSedes = onSnapshot(qSedes, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sede[];
      setSedes(docs.filter((s: Sede) => s.active));
    });

    const qCultos = query(collection(db, "cultos"));
    const unsubCultos = onSnapshot(qCultos, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Culto[];
      docs.sort((a, b) => {
        const dayOrder = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        const dayCompare = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayCompare !== 0) return dayCompare;
        return a.time.localeCompare(b.time);
      });
      setCultos(docs);
    });

    const qConfirmacoes = query(collection(db, "confirmacoes"), orderBy("createdAt", "desc"));
    const unsubConfirmacoes = onSnapshot(qConfirmacoes, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Confirmacao[];
      setConfirmacoes(docs);
    });

    setLoading(false);

    return () => {
      unsubSedes();
      unsubCultos();
      unsubConfirmacoes();
    };
  }, []);

  const openModal = (culto?: Culto) => {
    if (culto) {
      setEditingCulto(culto);
      setName(culto.name);
      setDescription(culto.description);
      setDay(culto.day);
      setTime(culto.time);
      setSede(culto.sede);
      setActive(culto.active);
    } else {
      setEditingCulto(null);
      setName("");
      setDescription("");
      setDay("Domingo");
      setTime("09:00");
      setSede("Geral");
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCulto(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nome do culto é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (editingCulto) {
        await updateDoc(doc(db, "cultos", editingCulto.id), {
          name: name.trim(),
          description: description.trim(),
          day,
          time,
          sede,
          active,
        });
        alert("Culto atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "cultos"), {
          name: name.trim(),
          description: description.trim(),
          day,
          time,
          sede,
          active: true,
        });
        alert("Culto criado com sucesso!");
      }
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar culto:", error);
      alert("Erro ao salvar culto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (culto: Culto) => {
    if (!confirm(`Tem certeza que deseja excluir "${culto.name}"?`)) return;

    try {
      await deleteDoc(doc(db, "cultos", culto.id));
      alert("Culto excluído.");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir culto.");
    }
  };

  const handleDeleteConfirmacao = async (confirmacao: Confirmacao) => {
    if (!confirm("Remover esta confirmação de presença?")) return;

    try {
      await deleteDoc(doc(db, "confirmacoes", confirmacao.id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir.");
    }
  };

  const kultosPorDia = cultos.reduce((acc, culto) => {
    if (!acc[culto.day]) acc[culto.day] = [];
    acc[culto.day].push(culto);
    return acc;
  }, {} as Record<string, Culto[]>);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Loader2 className="animate-spin" size={32} />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Agenda & Cultos</h1>
          <p className={styles.subtitle}>Gerencie a programação dos cultos e acompanhe as confirmações.</p>
        </div>
        <button className={styles.newBtn} onClick={() => openModal()}>
          <Plus size={18} /> Novo Culto
        </button>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === "cultos" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("cultos")}
        >
          <Calendar size={18} />
          Programação
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "confirmacoes" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("confirmacoes")}
        >
          <Users size={18} />
          Confirmações ({confirmacoes.length})
        </button>
      </div>

      {activeTab === "cultos" && (
        <div className={styles.cultosGrid}>
          {cultos.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={48} strokeWidth={1} />
              <p>Nenhum culto cadastrado.</p>
              <button className={styles.newBtn} onClick={() => openModal()}>
                <Plus size={18} /> Adicionar primeiro culto
              </button>
            </div>
          ) : (
            Object.entries(kultosPorDia).map(([day, cultosDia]) => (
              <div key={day} className={styles.dayGroup}>
                <h3 className={styles.dayTitle}>{day}</h3>
                {cultosDia.map((culto) => (
                  <div key={culto.id} className={styles.cultoCard}>
                    <div className={styles.cultoTime}>
                      <Clock size={14} />
                      {culto.time}
                    </div>
                    <div className={styles.cultoInfo}>
                      <h4>{culto.name}</h4>
                      <p>{culto.description}</p>
                      <div className={styles.cultoMeta}>
                        <span><MapPin size={12} /> {culto.sede}</span>
                      </div>
                    </div>
                    <div className={styles.cultoActions}>
                      <button onClick={() => openModal(culto)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(culto)} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "confirmacoes" && (
        <div className={styles.confirmacoesList}>
          {confirmacoes.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={48} strokeWidth={1} />
              <p>Nenhuma confirmação ainda.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Culto</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {confirmacoes.map((conf) => (
                  <tr key={conf.id}>
                    <td>
                      <div className={styles.userCell}>
                        <strong>{conf.userName}</strong>
                        <span>{conf.userEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{conf.cultoId}</strong>
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          {conf.cultoDay} às {conf.cultoTime}
                        </span>
                      </div>
                    </td>
                    <td>
                      {conf.createdAt?.toDate ? conf.createdAt.toDate().toLocaleDateString("pt-BR") : "-"}
                    </td>
                    <td>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteConfirmacao(conf)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.modalTitle}>
                {editingCulto ? "Editar Culto" : "Novo Culto"}
              </h2>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nome do Culto</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Ex: Celebração da Família"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Descrição</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Ex: Culto Principal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Dia da Semana</label>
                  <div className={`${styles.customSelect} customSelect`}>
                    <button 
                      className={styles.selectBtn}
                      onClick={(e) => { e.stopPropagation(); setShowDayDropdown(!showDayDropdown); }}
                    >
                      {day} <ChevronDown size={16} />
                    </button>
                    {showDayDropdown && (
                      <div className={styles.selectMenu}>
                        {DIAS_SEMANA.map((d) => (
                          <button
                            key={d}
                            className={styles.selectItem}
                            onClick={() => { setDay(d); setShowDayDropdown(false); }}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Horário</label>
                  <input 
                    type="time" 
                    className={styles.input}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Sede</label>
                <div className={`${styles.customSelect} customSelect`}>
                  <button 
                    className={styles.selectBtn}
                    onClick={(e) => { e.stopPropagation(); setShowSedeDropdown(!showSedeDropdown); }}
                  >
                    {sede} <ChevronDown size={16} />
                  </button>
                  {showSedeDropdown && (
                    <div className={styles.selectMenu}>
                      <button
                        className={styles.selectItem}
                        onClick={() => { setSede("Geral"); setShowSedeDropdown(false); }}
                      >
                        Geral (Todas)
                      </button>
                      {sedes.map((s) => (
                        <button
                          key={s.id}
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

              {editingCulto && (
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                    />
                    Culto ativo
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
                  {saving ? "Salvando..." : editingCulto ? "Atualizar" : "Criar Culto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}