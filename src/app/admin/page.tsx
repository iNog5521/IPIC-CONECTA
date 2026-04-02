"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { 
  Users, 
  Heart, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  Bell
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

interface Atividade {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  data: any;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    membros: 0,
    oracoes: 0,
    confirmacoes: 0,
    mensagens: 0
  });
  const [recentPrayers, setRecentPrayers] = useState<any[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, "users")), (snapshot) => {
      // Conta usuários que não são owner nem admin
      const usersCount = snapshot.docs.filter(d => {
        const role = d.data().role;
        return role !== 'owner' && role !== 'admin';
      }).length;
      setStats(prev => ({ ...prev, membros: usersCount }));
    });

    const unsubOracoes = onSnapshot(query(collection(db, "oracoes")), (snapshot) => {
      setStats(prev => ({ ...prev, oracoes: snapshot.size }));
      const oracoesRecentes = snapshot.docs.slice(0, 5).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentPrayers(oracoesRecentes);

      const novasAtividades: Atividade[] = snapshot.docs.slice(0, 3).map(doc => ({
        id: doc.id,
        tipo: 'oracao',
        titulo: doc.data().name || 'Pedido de Oração',
        descricao: doc.data().categoria || '',
        data: doc.data().createdAt
      }));
      setAtividades(prev => [...prev, ...novasAtividades]);
    });

    const unsubConfirmacoes = onSnapshot(query(collection(db, "confirmacoes")), (snapshot) => {
      setStats(prev => ({ ...prev, confirmacoes: snapshot.size }));
    });

    const unsubMensagens = onSnapshot(query(collection(db, "mensagens_admin")), (snapshot) => {
      setStats(prev => ({ ...prev, mensagens: snapshot.size }));

      const novasAtividades: Atividade[] = snapshot.docs.slice(0, 3).map(doc => ({
        id: doc.id,
        tipo: 'mensagem',
        titulo: 'Mensagem enviada',
        descricao: doc.data().userName || '',
        data: doc.data().data
      }));
      setAtividades(prev => {
        const combined = [...prev, ...novasAtividades];
        return combined.sort((a, b) => {
          if (!a.data?.toDate || !b.data?.toDate) return 0;
          return b.data.toDate() - a.data.toDate();
        }).slice(0, 6);
      });

      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubOracoes();
      unsubConfirmacoes();
      unsubMensagens();
    };
  }, []);

  const formatDate = (data: any) => {
    if (!data?.toDate) return '';
    return data.toDate().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'oracao': return <Heart size={16} />;
      case 'mensagem': return <MessageSquare size={16} />;
      case 'culto': return <Calendar size={16} />;
      case 'membro': return <Users size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getActivityColor = (tipo: string) => {
    switch (tipo) {
      case 'oracao': return { bg: '#fee2e2', color: '#dc2626' };
      case 'mensagem': return { bg: '#dbeafe', color: '#2563eb' };
      case 'culto': return { bg: '#fef3c7', color: '#d97706' };
      case 'membro': return { bg: '#d1fae5', color: '#059669' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const statCards = [
    { label: "Membros Ativos", value: stats.membros, icon: Users, color: "#1B3B36" },
    { label: "Pedidos de Oração", value: stats.oracoes, icon: Heart, color: "#EF4444" },
    { label: "Presenças Confirmadas", value: stats.confirmacoes, icon: Calendar, color: "#D4AF37" },
    { label: "Mensagens Enviadas", value: stats.mensagens, icon: MessageSquare, color: "#1FAA5B" },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Carregando dados...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        {statCards.map((stat: any) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
            </div>
            <div 
              className={styles.statIcon} 
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
            >
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <h2>Pedidos de Oração Recentes</h2>
            <Link href="/admin/oracoes" className={styles.viewMore}>
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.listCard}>
            {recentPrayers.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhum pedido de oração ainda.
              </div>
            ) : (
              recentPrayers.map((oracao: any) => (
                <div key={oracao.id} className={styles.listItem}>
                  <div className={styles.listInfo}>
                    <span className={styles.listTitle}>{oracao.name || 'Anônimo'}</span>
                    <span className={styles.listSubtitle}>{oracao.sede || 'Geral'} • {oracao.categoria || 'Geral'}</span>
                  </div>
                  <span className={styles.tag}>Pendente</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <h2>Atividade da Comunidade</h2>
          </div>
          <div className={styles.activityCard}>
            {atividades.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhuma atividade recente.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {atividades.map((atividade: any) => {
                  const colors = getActivityColor(atividade.tipo);
                  return (
                    <div 
                      key={atividade.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'var(--surface)'
                      }}
                    >
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        background: colors.bg, 
                        color: colors.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getActivityIcon(atividade.tipo)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>{atividade.titulo}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {atividade.descricao} • {formatDate(atividade.data)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
