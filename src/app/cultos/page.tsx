"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { MapPin, Clock, X, Calendar, Filter, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Sede, Culto, Confirmacao } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";



const CULTOS_FIXOS: Culto[] = [
  { id: "fixo-1", name: "Arrebatamento e Oração", description: "Escola Bíblica Dominical", day: "Domingo", time: "09:30", sede: "Geral", active: true },
  { id: "fixo-2", name: "Celebração da Família", description: "Culto Principal", day: "Domingo", time: "18:30", sede: "Geral", active: true },
  { id: "fixo-3", name: "Noite de Poder", description: "Estudo bíblico e oração", day: "Quarta-feira", time: "20:00", sede: "Geral", active: true },
];

export default function CultosPage() {
  const { user, profile } = useAuth();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [loadingCultos, setLoadingCultos] = useState(true);
  const [cultosError, setCultosError] = useState<string | null>(null);
  const [sedeSelecionada, setSedeSelecionada] = useState("Geral");
  const [confirmacoes, setConfirmacoes] = useState<Confirmacao[]>([]);
  const [loadingConfirmacoes, setLoadingConfirmacoes] = useState(true);
  const [showConfirmados, setShowConfirmados] = useState(false);
  const [todosConfirmados, setTodosConfirmados] = useState<Confirmacao[]>([]);
  const [selectedCulto, setSelectedCulto] = useState<Culto | null>(null);

  // Estados do Modal de Confirmação customizado
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
    const q = query(collection(db, "cultos"));
    let unsub: () => void;
    
    unsub = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Culto[];
        const ativos = docs.filter((c: Culto) => c.active);
        ativos.sort((a, b) => {
          const dayOrder = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
          const dayCompare = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
          if (dayCompare !== 0) return dayCompare;
          return a.time.localeCompare(b.time);
        });
        if (ativos.length > 0) {
          setCultos(ativos);
        }
        setLoadingCultos(false);
      },
      (err) => {
        setCultosError(err.code);
        setLoadingCultos(false);
      }
    );
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
    }, (err) => { /* silenciar */ });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "confirmacoes"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Confirmacao[];
      setConfirmacoes(docs);
      setLoadingConfirmacoes(false);
    }, (err) => { /* silenciar */ });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "confirmacoes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Confirmacao[];
      setTodosConfirmados(docs);
    }, (err) => { /* silenciar */ });

    return () => unsubscribe();
  }, []);

  const isConfirmed = (cultoId: string) => {
    return confirmacoes.some(c => c.cultoId === cultoId);
  };

  const handleConfirm = async (culto: Culto) => {
    if (!user || !profile) {
      toast.error("Você precisa estar logado para confirmar presença.");
      return;
    }

    if (isConfirmed(culto.name)) return;

    try {
      await addDoc(collection(db, "confirmacoes"), {
        cultoId: culto.name,
        cultoTime: culto.time,
        cultoDay: culto.day,
        userId: user.uid,
        userName: profile.nome || user.displayName || user.email,
        userEmail: user.email,
        sede: sedeSelecionada === "Geral" ? "Sede Central" : sedeSelecionada,
        createdAt: new Date(),
      });
      toast.success("Presença confirmada! Nos vemos lá!");
    } catch (error) {
      console.error("Erro ao confirmar:", error);
      toast.error("Erro ao confirmar presença.");
    }
  };

  const handleCancel = (cultoId: string) => {
    const confirmacao = confirmacoes.find(c => c.cultoId === cultoId);
    if (!confirmacao) return;

    setConfirmModal({
      isOpen: true,
      title: "Cancelar Presença",
      message: "Tem certeza que deseja cancelar sua confirmação de presença neste culto?",
      isDestructive: true,
      confirmText: "Sim, Cancelar",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "confirmacoes", confirmacao.id));
          toast.success("Confirmação cancelada.");
        } catch (error) {
          console.error("Erro ao cancelar:", error);
          toast.error("Erro ao cancelar confirmação.");
        }
      }
    });
  };

  const getConfirmadosCount = (cultoId: string) => {
    return todosConfirmados.filter(c => c.cultoId === cultoId).length;
  };

  if (loadingCultos) {
    return (
      <div className={styles.container} style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (cultosError) {
    return (
      <div className={styles.container} style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Faça login para ver a programação.</p>
      </div>
    );
  }

  const kultosPorDia = cultos.filter(c => 
    sedeSelecionada === "Geral" || c.sede === "Geral" || c.sede === sedeSelecionada
  ).reduce((acc, culto) => {
    if (!acc[culto.day]) acc[culto.day] = [];
    acc[culto.day].push(culto);
    return acc;
  }, {} as Record<string, Culto[]>);

  const diasOrdenados = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Programação</h1>
        <p className={styles.subtitle}>Encontre o melhor horário para adorarmos juntos.</p>
      </header>

      <div className={styles.sedesSelector}>
        <div className={styles.sedeDropdown}>
          <button 
            className={`${styles.sedeBtn} ${styles.active}`}
            onClick={() => {
              const dropdown = document.getElementById('cultoSedeDropdown');
              dropdown?.classList.toggle(styles.show);
            }}
          >
            <Filter size={16} /> {sedeSelecionada === "Geral" ? "Todas as Sedes" : sedeSelecionada} <ChevronDown size={16} />
          </button>
          <div id="cultoSedeDropdown" className={styles.sedeDropdownMenu}>
            <button
              className={styles.sedeDropdownItem}
              onClick={() => {
                setSedeSelecionada("Geral");
                document.getElementById('cultoSedeDropdown')?.classList.remove(styles.show);
              }}
            >
              Todas as Sedes
            </button>
            {sedes.map((sede) => (
              <button
                key={sede.id}
                className={styles.sedeDropdownItem}
                onClick={() => {
                  setSedeSelecionada(sede.nome);
                  document.getElementById('cultoSedeDropdown')?.classList.remove(styles.show);
                }}
              >
                {sede.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.agenda}>
        {diasOrdenados.map(day => {
          const cultosDoDia = kultosPorDia[day];
          if (!cultosDoDia || cultosDoDia.length === 0) return null;
          
          return (
            <div key={day} className={styles.dayGroup}>
              <h2 className={styles.dayTitle}>{day}</h2>
              {cultosDoDia.map((culto, index) => (
                <div key={`${culto.id}-${index}`} className={styles.cultoCard}>
                  <div className={styles.timeInfo}>
                    <Clock size={16} />
                    <span>{culto.time}h</span>
                  </div>
                  <div className={styles.cultoDetails}>
                    <h3>{culto.name}</h3>
                    <p style={{ 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {culto.description || "Sem descrição"}
                    </p>
                    <p style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '12px', 
                      color: 'var(--primary)',
                      fontWeight: '600',
                      margin: 0
                    }}>
                      <MapPin size={12} />
                      {culto.sede === "Geral" ? "Todas as Sedes" : culto.sede}
                    </p>
                    {(profile?.role === 'admin' || profile?.role === 'owner') && getConfirmadosCount(culto.name) > 0 && (
                      <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                        {getConfirmadosCount(culto.name)} confirmado(s)
                      </p>
                    )}
                  </div>
                  <div className={styles.cultoActions}>
                    {user && !loadingConfirmacoes && (
                      isConfirmed(culto.name) ? (
                        <button 
                          className={styles.confirmBtn}
                          style={{ background: '#ef4444' }}
                          onClick={() => handleCancel(culto.name)}
                        >
                          Cancelar
                        </button>
                      ) : (
                        <button 
                          className={styles.confirmBtn}
                          onClick={() => handleConfirm(culto)}
                        >
                          Confirmar
                        </button>
                      )
                    )}
                    {!user && (
                      <span style={{ fontSize: '12px', color: '#888' }}>Login necessário</span>
                    )}
                    <button 
                      onClick={() => setSelectedCulto(culto)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--primary)', 
                        fontWeight: '700', 
                        fontSize: '0.75rem', 
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Ler mais
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {profile?.role === 'admin' && todosConfirmados.length > 0 && (
        <button 
          className={styles.confirmBtn}
          style={{ marginTop: '20px', background: '#6366f1' }}
          onClick={() => setShowConfirmados(true)}
        >
          Ver lista de confirmados ({todosConfirmados.length})
        </button>
      )}

      {showConfirmados && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Lista de Confirmados</h2>
              <button onClick={() => setShowConfirmados(false)}><X size={20} /></button>
            </div>
            {Object.entries(todosConfirmados.reduce((acc, c) => {
              if (!acc[c.cultoId]) acc[c.cultoId] = [];
              acc[c.cultoId].push(c);
              return acc;
            }, {} as Record<string, Confirmacao[]>)).map(([cultoId, confirmados]) => (
              <div key={cultoId} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '14px', color: '#6366f1', marginBottom: '8px' }}>
                  {cultoId} ({confirmados.length})
                </h3>
                {confirmados.map((c, i) => (
                  <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '14px' }}>
                    {c.userName} ({c.userEmail})
                  </div>
                ))}
              </div>
            ))}
            </div>
          </div>
        )}

      {/* Modal de Detalhes do Culto */}
      {selectedCulto && (
        <div 
          className={styles.modalOverlay}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setSelectedCulto(null)}
        >
          <div 
            className={styles.modalContent}
            style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>{selectedCulto.name}</h2>
              <button onClick={() => setSelectedCulto(null)}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} /> {selectedCulto.day}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {selectedCulto.time}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {selectedCulto.sede}</span>
            </div>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{selectedCulto.description}</p>
            {user && !loadingConfirmacoes && (
              <div style={{ marginTop: '1.5rem' }}>
                {isConfirmed(selectedCulto.name) ? (
                  <button 
                    className={styles.confirmBtn}
                    style={{ width: '100%', background: '#ef4444' }}
                    onClick={() => { handleCancel(selectedCulto.name); setSelectedCulto(null); }}
                  >
                    Cancelar Presença
                  </button>
                ) : (
                  <button 
                    className={styles.confirmBtn}
                    style={{ width: '100%' }}
                    onClick={() => { handleConfirm(selectedCulto); setSelectedCulto(null); }}
                  >
                    Confirmar Presença
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação Customizado */}
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