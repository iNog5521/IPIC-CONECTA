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
  onSnapshot
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

  // 1. Listener de Cultos (Público)
  useEffect(() => {
    const q = query(collection(db, "cultos"));
    
    const unsub = onSnapshot(q, 
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
        console.error("Erro ao carregar cultos:", err);
        // Só travamos se for erro crítico. Se for erro de permissão (inesperado aqui), silenciamos.
        if (err.code !== "permission-denied") {
          setCultosError(err.code);
        }
        setLoadingCultos(false);
      }
    );
    return () => unsub();
  }, []);

  // 2. Listener de Sedes (Público)
  useEffect(() => {
    const q = query(collection(db, "sedes"), where("active", "==", true));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sede[];
      setSedes(docs);
    }, (err) => { 
      console.warn("Erro no listener de sedes (silenciado):", err);
    });
    return () => unsub();
  }, []);

  // 3. Listener de Confirmações do Usuário (Logado)
  useEffect(() => {
    if (!user) {
      setLoadingConfirmacoes(false);
      return;
    }

    const q = query(collection(db, "confirmacoes"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Confirmacao[];
      setConfirmacoes(docs);
      setLoadingConfirmacoes(false);
    }, (err) => { 
      console.warn("Erro no listener de confirmações do usuário:", err);
      setLoadingConfirmacoes(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 4. Listener Geral de Confirmações (Para o Contador) - Agora mais robusto
  useEffect(() => {
    // Tenta carregar todas as confirmações para o contador
    const q = query(collection(db, "confirmacoes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Confirmacao[];
      setTodosConfirmados(docs);
    }, (err) => { 
      // Se falhar (ex: deslogado), apenas silenciamos e o contador fica em zero.
      // Isso evita que a página trave.
      console.log("Acesso ao contador global restrito (modo visitante).");
    });

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

    if (isConfirmed(culto.id)) return;

    try {
      await addDoc(collection(db, "confirmacoes"), {
        cultoId: culto.id,
        cultoName: culto.name,
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
      <div className={styles.container} style={{ padding: '4rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Carregando programação...</p>
      </div>
    );
  }

  if (cultosError) {
    return (
      <div className={styles.container} style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Sincronizando com o servidor...</p>
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
                      margin: '0 0 0.5rem 0',
                      whiteSpace: 'pre-wrap'
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
                    {getConfirmadosCount(culto.id) > 0 && (
                      <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '4.5rem' }}>
                         {getConfirmadosCount(culto.id)} {getConfirmadosCount(culto.id) === 1 ? "pessoa confirmada" : "pessoas confirmadas"}
                      </p>
                    )}
                  </div>
                  <div className={styles.cultoActions}>
                    {user && !loadingConfirmacoes && (
                      isConfirmed(culto.id) ? (
                        <button 
                          className={styles.confirmBtn}
                          style={{ background: '#ef4444', color: 'white' }}
                          onClick={() => handleCancel(culto.id)}
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
                      <span style={{ fontSize: '10px', color: '#888', textAlign: 'center', marginBottom: '4px' }}>Entrar para confirmar</span>
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

      {(profile?.role === 'admin' || profile?.role === 'owner') && todosConfirmados.length > 0 && (
        <button 
          className={styles.confirmBtn}
          style={{ marginTop: '20px', background: '#6366f1', color: 'white', width: '100%', padding: '1rem' }}
          onClick={() => setShowConfirmados(true)}
        >
          Ver lista de confirmados ({todosConfirmados.length})
        </button>
      )}

      {showConfirmados && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Lista de Confirmados</h2>
              <button onClick={() => setShowConfirmados(false)}><X size={20} /></button>
            </div>
            {Object.entries(todosConfirmados.reduce((acc, c) => {
              const groupName = c.cultoName || c.cultoId;
              if (!acc[groupName]) acc[groupName] = [];
              acc[groupName].push(c);
              return acc;
            }, {} as Record<string, Confirmacao[]>)).map(([groupName, confirmados]) => (
              <div key={groupName} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '14px', color: '#6366f1', marginBottom: '8px', fontWeight: '700' }}>
                  {groupName} ({confirmados.length})
                </h3>
                {confirmados.map((c, i) => (
                  <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px', color: 'var(--text-primary)' }}>
                    {c.userName} <span style={{ color: '#888', fontSize: '11px' }}>({c.userEmail})</span>
                  </div>
                ))}
              </div>
            ))}
            </div>
          </div>
        )}

      {/* Modal de Detalhes do Culto com pre-wrap */}
      {selectedCulto && (
        <div 
          className={styles.modalOverlay}
          onClick={() => setSelectedCulto(null)}
        >
          <div 
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary)', lineHeight: '1.2' }}>{selectedCulto.name}</h2>
              <button onClick={() => setSelectedCulto(null)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} /> {selectedCulto.day}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> {selectedCulto.time}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} /> {selectedCulto.sede}</span>
            </div>

            <p style={{ color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
              {selectedCulto.description || "Nenhuma descrição detalhada disponível."}
            </p>

            {user && !loadingConfirmacoes && (
              <div style={{ marginTop: 'auto' }}>
                {isConfirmed(selectedCulto.id) ? (
                  <button 
                    className={styles.confirmBtn}
                    style={{ width: '100%', background: '#ef4444', color: 'white', padding: '1rem' }}
                    onClick={() => { handleCancel(selectedCulto.id); setSelectedCulto(null); }}
                  >
                    Cancelar Presença
                  </button>
                ) : (
                  <button 
                    className={styles.confirmBtn}
                    style={{ width: '100%', padding: '1rem' }}
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