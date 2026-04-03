"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Phone, MapPin, Calendar, ArrowRight, Heart, X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, collection, query, onSnapshot } from "firebase/firestore";
import { CalendarInput } from "@/components/ui/calendar-input";

interface Sede {
  id: string;
  nome: string;
  endereco: string;
  active: boolean;
}

export default function CadastroPage() {
  const router = useRouter();
  const [sedes, setSedes] = useState<Sede[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nascimento, setNascimento] = useState<Date | undefined>();
  const [fielDesde, setFielDesde] = useState<Date | undefined>();
  const [telefone, setTelefone] = useState("");
  const [sede, setSede] = useState("");
  const [showSedeModal, setShowSedeModal] = useState(false);
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

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

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    if (!nascimento) {
      setErro("Por favor, selecione sua data de nascimento.");
      setLoading(false);
      return;
    }

    if (!fielDesde) {
      setErro("Por favor, selecione desde quando você é fiel.");
      setLoading(false);
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Send email verification
      try {
        await sendEmailVerification(user);
      } catch (verifyError) {
        console.error("Erro ao enviar email de verificação:", verifyError);
      }

      // Update Profile Name
      await updateProfile(user, { displayName: nome });

      // Security Logic: Set owner role automatically for the master email
      const isOwner = email.toLowerCase() === "inog5521@gmail.com";
      const role = isOwner ? "owner" : "user";

      // Force refresh to ensure auth state is propagated before Firestore write
      await user.getIdToken(true);

      // Save additional profile data in Firestore collection "users"
      try {
        await setDoc(doc(db, "users", user.uid), {
          nome,
          email,
          nascimento: nascimento.toISOString(),
          fielDesde: fielDesde.toISOString(),
          telefone,
          sede,
          role,
          createdAt: new Date().toISOString()
        }, { merge: true });
        console.log("Perfil salvo com sucesso:", { nome, email, nascimento, fielDesde, telefone, sede, role });
      } catch (firestoreError) {
        console.error("Erro ao salvar no Firestore:", firestoreError);
        // Don't block the flow, the user can still complete registration
      }

      // Success! Show message and redirect to login
      alert("Conta criada! Verifique seu e-mail para ativar a conta.");
      router.push("/login?verified=pending");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setErro("Este e-mail já está em uso.");
      } else if (error.code === 'auth/weak-password') {
        setErro("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setErro("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <h1>Criar Conta</h1>
          <p>Junte-se à comunidade IPIC CONECTA SEDE.</p>
        </div>

        {erro && <div className={styles.errorMsg}>{erro}</div>}

        <form className={styles.form} onSubmit={handleCadastro}>
          <div className={styles.inputGroup}>
            <label>Nome Completo*</label>
            <div className={styles.inputWrapper}>
              <User size={18} />
              <input 
                type="text" 
                placeholder="Como quer ser chamado?" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required disabled={loading} 
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>E-mail*</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} />
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required disabled={loading} 
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Nascimento*</label>
              <CalendarInput
                value={nascimento}
                onChange={setNascimento}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Telefone (Opcional)</label>
              <div className={styles.inputWrapper}>
                <Phone size={18} />
                <input 
                  type="tel" 
                  placeholder="(11) 99999-9999" 
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={loading} 
                />
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Fiel Desde*</label>
            <CalendarInput
              value={fielDesde}
              onChange={setFielDesde}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Sua Sede*</label>
            <button 
              type="button"
              onClick={() => setShowSedeModal(true)}
              disabled={loading}
              className={styles.select}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: sede ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: loading ? 'not-allowed' : 'pointer',
                width: '100%',
                fontWeight: sede ? '500' : '400'
              }}
            >
              <MapPin size={18} />
              {sede || "Selecione sua sede..."}
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label>Defina uma Senha*</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} />
              <input 
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required disabled={loading} 
              />
            </div>
          </div>

          <button type="submit" className={styles.registerBtn} disabled={loading}>
            {loading ? "Criando conta..." : "Criar minha conta"} <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footer}>
          Já tem uma conta? <Link href="/login">Fazer Login</Link>
        </p>
      </div>

      {showSedeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }} onClick={() => setShowSedeModal(false)}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '1.5rem', width: '90%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>Selecione sua Sede</h2>
              <button onClick={() => setShowSedeModal(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sedes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSede(s.nome); setShowSedeModal(false); }}
                  style={{
                    padding: '0.75rem 1rem', borderRadius: '12px', border: sede === s.nome ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: sede === s.nome ? 'var(--primary-faded)' : 'white', textAlign: 'left', cursor: 'pointer', fontWeight: sede === s.nome ? '700' : '400',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <MapPin size={16} style={{ color: sede === s.nome ? 'var(--primary)' : 'var(--text-muted)' }} />
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
