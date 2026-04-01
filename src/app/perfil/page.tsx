"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  LogOut, 
  ChevronRight, 
  MessageCircle, 
  Settings, 
  ShieldCheck,
  Lock,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, updateDoc, collection, query, onSnapshot } from "firebase/firestore";

interface Sede {
  id: string;
  nome: string;
  endereco: string;
  active: boolean;
}

export default function PerfilPage() {
  const { user, profile, loading } = useAuth();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [showSedeModal, setShowSedeModal] = useState(false);
  const [newSede, setNewSede] = useState("");

  useEffect(() => {
    const q = query(collection(db, "sedes"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sede[];
      setSedes(docs.filter((s: Sede) => s.active));
    });
    return () => unsub();
  }, []);

  const handleChangeSede = async (novaSede?: string) => {
    const sedeParaSalvar = novaSede || newSede;
    if (!sedeParaSalvar || !user) return;
    
    try {
      await updateDoc(doc(db, "users", user.uid), {
        sede: sedeParaSalvar
      });
      setShowSedeModal(false);
      alert("Sede atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar sede:", error);
      alert("Erro ao atualizar sede.");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  // Se não estiver logado, mostra tela de convite ao login
  if (!user) {
    return (
      <div className={styles.guestContainer}>
        <div className={styles.guestCard}>
          <User size={64} className={styles.guestIcon} />
          <h1>Olá, visitante!</h1>
          <p>Faça login para acessar seu perfil e mensagens da comunidade.</p>
          <Link href="/login" className={styles.loginBtn}>
            Fazer Login agora
          </Link>
          <Link href="/cadastro" className={styles.signupLink}>
            Não tem uma conta? Cadastre-se
          </Link>
        </div>
      </div>
    );
  }

  // Lógica de Admin/Owner
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || user.email === 'inog5521@gmail.com';

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarArea}>
          <div className={styles.avatar}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "Avatar"} className={styles.avatarImg} />
            ) : (
              <User size={40} className={styles.avatarPlaceholder} />
            )}
            <button className={styles.cameraBtn}>
              <Camera size={16} />
            </button>
          </div>
          <h1 className={styles.userName}>{user.displayName || profile?.nome || "Membro IPIC"}</h1>
          <span className={styles.userBadge}>{profile?.role === 'owner' ? 'Fundador' : profile?.role === 'admin' ? 'Administrador' : 'Fiel IPIC'}</span>
        </div>
      </div>

      <div className={styles.content}>
        {/* ACESSO AO PAINEL ADMIN (VISÍVEL APENAS PARA ADMINS/OWNER) */}
        {isAdmin && (
          <section className={styles.section}>
            <Link href="/admin" className={styles.adminAccessBtn}>
              <div className={styles.adminIconBox}>
                <ShieldCheck size={24} />
              </div>
              <div className={styles.adminTextBox}>
                <h3>Painel Administrativo</h3>
                <p>Gerenciar sedes, cultos e membros</p>
              </div>
              <ChevronRight size={20} />
            </Link>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Mensagens da Liderança</h2>
          <div className={styles.inboxCard}>
            <div className={styles.inboxHeader}>
              <MessageCircle size={18} />
              <span>Privado</span>
            </div>
            <p>{profile?.lastMessage || "Nenhuma mensagem nova da liderança no momento."}</p>
            {profile?.lastMessageDate && <span className={styles.msgDate}>{profile.lastMessageDate}</span>}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dados Pessoais</h2>
          <div className={styles.dataList}>
            <div className={styles.dataItem}>
              <div className={styles.dataIcon}><Mail size={18} /></div>
              <div className={styles.dataInfo}>
                <span className={styles.label}>E-mail</span>
                <span className={styles.value}>{user.email}</span>
              </div>
            </div>

            {profile?.telefone && (
              <div className={styles.dataItem}>
                <div className={styles.dataIcon}><Phone size={18} /></div>
                <div className={styles.dataInfo}>
                  <span className={styles.label}>Telefone</span>
                  <span className={styles.value}>{profile.telefone}</span>
                </div>
              </div>
            )}

            <div className={styles.dataItem}>
              <div className={styles.dataIcon}><Calendar size={18} /></div>
              <div className={styles.dataInfo}>
                <span className={styles.label}>Nascimento</span>
                <span className={styles.value}>{profile?.nascimento || "-- / -- / ----"}</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Configurações</h2>
          <div className={styles.settingsGrid}>
            <div className={styles.dataItem}>
              <div className={`${styles.dataIcon} ${styles.settingsIcon}`}><Lock size={18} /></div>
              <div className={styles.dataInfo}>
                <span className={styles.label}>Segurança</span>
                <span className={styles.value}>Alterar Senha</span>
              </div>
              <ChevronRight size={18} className={styles.arrowRight} />
            </div>

            <div className={styles.sedeCard}>
              <div className={styles.sedeInfo}>
                <MapPin size={20} className={styles.sedeIcon} />
                <div className={styles.sedeText}>
                  <span className={styles.label}>Sua Sede Atual</span>
                  <span className={styles.value}>{profile?.sede || "Não definida"}</span>
                </div>
              </div>
              <button className={styles.changeSedeBtn} onClick={() => {
                setNewSede(profile?.sede || "");
                setShowSedeModal(true);
              }}>
                Mudar <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
          Sair da Conta
        </button>
      </div>

      {/* Modal de Troca de Sede */}
      {showSedeModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }} onClick={() => setShowSedeModal(false)}>
          <div style={{
            backgroundColor: 'white', width: '100%', maxWidth: '400px', 
            borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>Alterar Minha Sede</h2>
              <button onClick={() => setShowSedeModal(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Selecione a sede que você participa:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {sedes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setNewSede(s.nome); handleChangeSede(s.nome); }}
                  style={{
                    padding: '0.75rem 1rem', borderRadius: '12px', border: newSede === s.nome ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: newSede === s.nome ? 'var(--primary-faded)' : 'white', textAlign: 'left', cursor: 'pointer', fontWeight: newSede === s.nome ? '700' : '400',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <MapPin size={16} style={{ color: newSede === s.nome ? 'var(--primary)' : 'var(--text-muted)' }} />
                  {s.nome}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSedeModal(false)} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '12px', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
