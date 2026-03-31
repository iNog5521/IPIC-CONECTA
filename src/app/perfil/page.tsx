"use client";

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
  Lock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function PerfilPage() {
  const { user, profile, loading } = useAuth();

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
                  <span className={styles.value}>{profile?.sede || "Sede Central"}</span>
                </div>
              </div>
              <button className={styles.changeSedeBtn}>
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
    </div>
  );
}
