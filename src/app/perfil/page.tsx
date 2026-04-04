"use client";

import { useState, useEffect, useRef } from "react";
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
  X,
  Trash2,
  Check
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { signOut, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, collection, query, onSnapshot, deleteDoc, where, orderBy } from "firebase/firestore";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { toast } from "sonner";

interface Sede {
  id: string;
  nome: string;
  endereco: string;
  active: boolean;
}

interface MensagemAdmin {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  mensagem: string;
  data: any;
  lida: boolean;
  deletedAt?: any;
}

export default function PerfilPage() {
  const { user, profile, loading, profileLoading } = useAuth();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [showSedeModal, setShowSedeModal] = useState(false);
  const [newSede, setNewSede] = useState("");
  const [minhasMensagens, setMinhasMensagens] = useState<MensagemAdmin[]>([]);
  const [showMsgHistory, setShowMsgHistory] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<MensagemAdmin | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

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

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "mensagens_admin"), 
      where("userId", "==", user.uid),
      orderBy("data", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MensagemAdmin[];
      // Filtra no cliente mensagens excluídas
      setMinhasMensagens(msgs.filter((m: MensagemAdmin) => !m.deletedAt));
    });
    return () => unsub();
  }, [user]);

  const handleChangeSede = async (novaSede?: string) => {
    const sedeParaSalvar = novaSede || newSede;
    if (!sedeParaSalvar || !user) return;
    
    try {
      // Usa setDoc com merge para criar o documento se não existir
      await setDoc(doc(db, "users", user.uid), {
        sede: sedeParaSalvar
      }, { merge: true });
      setShowSedeModal(false);
      toast.success("Sede atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar sede:", error);
      toast.error("Erro ao atualizar sede.");
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetPasswordLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setShowResetPasswordModal(false);
      toast.success(`E-mail de redefinição enviado para ${user.email}.`);
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      if (error.code === "auth/invalid-email") {
        toast.error("E-mail inválido.");
      } else if (error.code === "auth/user-not-found") {
        toast.error("Usuário não encontrado.");
      } else {
        toast.error("Erro ao enviar e-mail de redefinição.");
      }
    }
    setResetPasswordLoading(false);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(crop);
  };

  const getCroppedImage = async (): Promise<string | null> => {
    if (!completedCrop || !imgRef.current) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.95);
    });
  };

  const handleConfirmCrop = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    setShowCropModal(false);

    try {
      const croppedBase64 = await getCroppedImage();
      if (!croppedBase64) {
        toast.error("Erro ao processar imagem.");
        setUploadingAvatar(false);
        return;
      }

      // Convert base64 to blob
      const res = await fetch(croppedBase64);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      formData.append("folder", "ipic-avatares");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (data.error) {
        toast.error("Erro ao fazer upload da imagem: " + data.error);
        return;
      }

      await updateProfile(user, {
        photoURL: data.url
      });

      await updateDoc(doc(db, "users", user.uid), {
        photoURL: data.url
      });
      
      toast.success("Foto atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da imagem.");
    }
    setUploadingAvatar(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setImageToCrop(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setShowCropModal(true);
    setCrop(undefined);
  };

  const handleDeleteMinhaMensagem = async (msgId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta mensagem? Ela será removida do seu histórico mas permanecerá no painel admin.")) return;
    try {
      await updateDoc(doc(db, "mensagens_admin", msgId), {
        deletedAt: new Date()
      });
      toast.success("Mensagem excluída!");
    } catch (error) {
      toast.error("Erro ao excluir mensagem.");
    }
  };

  const handleClearAllMinhasMensagens = async () => {
    if (!confirm("ATENÇÃO: Isso excluirá TODAS as suas mensagens do seu histórico. Elas permanecerão no painel admin. Continuar?")) return;
    try {
      for (const msg of minhasMensagens) {
        await updateDoc(doc(db, "mensagens_admin", msg.id), {
          deletedAt: new Date()
        });
      }
      setShowMsgHistory(false);
      toast.success("Histórico limpo!");
    } catch (error) {
      toast.error("Erro ao limpar mensagens.");
    }
  };

  if (loading || profileLoading) {
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
            <button 
              className={styles.cameraBtn} 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <span style={{ fontSize: '10px' }}>...</span>
              ) : (
                <Camera size={16} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
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
          <div className={styles.inboxCard} onClick={() => {
            if (minhasMensagens.length > 0) {
              setSelectedMsg(minhasMensagens[0]);
              setShowMsgModal(true);
            }
          }} style={{ cursor: minhasMensagens.length > 0 ? 'pointer' : 'default' }}>
            <div className={styles.inboxHeader}>
              <MessageCircle size={18} />
              <span>Privado</span>
              {minhasMensagens.length > 0 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMinhaMensagem(minhasMensagens[0].id);
                  }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  title="Excluir mensagem"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p>{profile?.lastMessage || "Nenhuma mensagem nova da liderança no momento."}</p>
            {profile?.lastMessageDate && <span className={styles.msgDate}>{profile.lastMessageDate}</span>}
            {minhasMensagens.length > 1 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem', display: 'block' }}>
                + {minhasMensagens.length - 1} mensagem(ns) anterior(es) - Toque para ver
              </span>
            )}
          </div>
          {minhasMensagens.length > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMsgHistory(true); }}
              style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Ver histórico completo
            </button>
          )}
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
                <span className={styles.value}>
                  {profile?.nascimento 
                    ? new Date(profile.nascimento).toLocaleDateString("pt-BR") 
                    : "--/--/----"}
                </span>
              </div>
            </div>

            {profile?.fielDesde && (
              <div className={styles.dataItem}>
                <div className={styles.dataIcon}><Calendar size={18} /></div>
                <div className={styles.dataInfo}>
                  <span className={styles.label}>Membro Desde</span>
                  <span className={styles.value}>
                    {new Date(profile.fielDesde).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Configurações</h2>
          <div className={styles.settingsGrid}>
            <div 
              className={styles.dataItem} 
              onClick={() => setShowResetPasswordModal(true)}
              style={{ cursor: 'pointer' }}
            >
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

      {/* Modal de Detalhes da Mensagem */}
      {showMsgModal && selectedMsg && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }} onClick={() => setShowMsgModal(false)}>
          <div style={{
            backgroundColor: 'white', width: '100%', maxWidth: '400px', 
            borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>Mensagem da Liderança</h2>
              <button onClick={() => setShowMsgModal(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {selectedMsg.data?.toDate ? selectedMsg.data.toDate().toLocaleDateString("pt-BR") : ""}
            </p>
            <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {selectedMsg.mensagem}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => { handleDeleteMinhaMensagem(selectedMsg.id); setShowMsgModal(false); }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Trash2 size={16} /> Excluir
              </button>
              <button 
                onClick={() => { setShowMsgModal(false); setShowMsgHistory(true); }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: '600' }}
              >
                Ver Todas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Mensagens */}
      {showMsgHistory && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }} onClick={() => setShowMsgHistory(false)}>
          <div style={{
            backgroundColor: 'white', width: '100%', maxWidth: '500px', maxHeight: '80vh',
            borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>Histórico de Mensagens</h2>
              <button onClick={() => setShowMsgHistory(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {minhasMensagens.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleClearAllMinhasMensagens}
                  style={{ background: '#fee2e2', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Trash2 size={14} /> Limpar Tudo
                </button>
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {minhasMensagens.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Nenhuma mensagem recebida.
                </p>
              ) : (
                minhasMensagens.map((msg) => (
                  <div 
                    key={msg.id} 
                    onClick={() => { setSelectedMsg(msg); setShowMsgHistory(false); setShowMsgModal(true); }}
                    style={{ padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  >
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {msg.mensagem}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {msg.data?.toDate ? msg.data.toDate().toLocaleDateString("pt-BR") : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Redefinição de Senha */}
      {showResetPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }} onClick={() => setShowResetPasswordModal(false)}>
          <div style={{
            backgroundColor: 'white', width: '100%', maxWidth: '400px', 
            borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>Alterar Senha</h2>
              <button onClick={() => setShowResetPasswordModal(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Enviaremos um link de redefinição de senha para o seu e-mail <strong>{user?.email}</strong>.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Clique no link do e-mail para criar uma nova senha.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => setShowResetPasswordModal(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleResetPassword}
                disabled={resetPasswordLoading}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: '600', opacity: resetPasswordLoading ? 0.7 : 1 }}
              >
                {resetPasswordLoading ? "Enviando..." : "Enviar Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recorte de Imagem */}
      {showCropModal && imageToCrop && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', 
          display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', width: '100%', maxWidth: '400px', 
            borderRadius: '24px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>Ajustar Foto</h2>
              <button 
                onClick={() => { setShowCropModal(false); setImageToCrop(null); }}
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflow: 'hidden', borderRadius: '12px' }}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={imageToCrop}
                  alt="Crop"
                  style={{ maxWidth: '100%', display: 'block' }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
              Arraste para posicionar a imagem
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                onClick={() => { setShowCropModal(false); setImageToCrop(null); }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmCrop}
                disabled={uploadingAvatar}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {uploadingAvatar ? "Processando..." : <><Check size={18} /> Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
