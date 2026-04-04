"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Send, History, Plus, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { toast } from "sonner";
import { OracaoPedido } from "@/types";

export default function OracoesPage() {
  const { user, profile, loading } = useAuth();
  const [pedido, setPedido] = useState("");
  const [historico, setHistorico] = useState<OracaoPedido[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Busca os pedidos do usuário (sem o orderBy longo do BD para ignorar a necessidade de Índice composto)
    const q = query(
      collection(db, "oracoes"),
      where("uid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: OracaoPedido[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as OracaoPedido);
      });
      
      // Ordena por data mais recente localmente (Bypass de Firebase Index Error)
      list.sort((a, b) => {
        const dataA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dataB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dataB - dataA;
      });
      
      setHistorico(list);
    });

    return () => unsub();
  }, [user]);

  const handleSendPedido = async () => {
    if (!pedido.trim() || !user) return;
    setIsSending(true);

    try {
      await addDoc(collection(db, "oracoes"), {
        uid: user.uid,
        nome: profile?.nome || user.displayName || "Membro IPIC",
        sede: profile?.sede || "Não definida",
        texto: pedido.trim(),
        status: "Pendente",
        createdAt: serverTimestamp(),
      });
      
      setPedido(""); // Limpa o textarea após sucesso
      toast.success("Seu pedido foi enviado! Estaremos orando por você.");
    } catch (e) {
      console.error("Erro ao enviar oração:", e);
      toast.error("Erro ao enviar o pedido. Tente novamente.");
    }
    
    setIsSending(false);
  };

  const handleDeletePedido = async (id: string) => {
    if (!confirm("Deseja realmente remover este pedido de oração?")) return;
    try {
      await deleteDoc(doc(db, "oracoes", id));
    } catch (e) {
      console.error("Erro ao excluir oração:", e);
      toast.error("Não foi possível excluir o pedido.");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--primary)" }}>Carregando...</div>;
  }

  if (!user) {
    return (
      <div className={styles.container} style={{ textAlign: "center", paddingTop: "4rem" }}>
        <User size={64} style={{ color: "var(--primary-light)", marginBottom: "1rem" }} />
        <h1 className={styles.title} style={{ fontSize: "1.5rem" }}>Faça Login</h1>
        <p className={styles.subtitle} style={{ marginBottom: "2rem" }}>
          Você precisa estar logado para enviar pedidos de oração.
        </p>
        <Link href="/login" style={{ 
          background: "var(--primary)", color: "white", padding: "0.8rem 1.5rem", 
          borderRadius: "100px", fontWeight: "bold", textDecoration: "none" 
        }}>
          Fazer Login Agora
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Orações</h1>
        <p className={styles.subtitle}>Apresente seu pedido e vamos orar por você.</p>
      </header>

      <div className={styles.newRequestArea}>
        <div className={styles.inputCard}>
          <textarea 
            placeholder="Como podemos orar por você hoje?" 
            className={styles.textarea}
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
            disabled={isSending}
            maxLength={500}
          ></textarea>
          <div className={styles.inputFooter}>
            <span className={styles.charCount}>{pedido.length} / 500</span>
            <button 
              className={styles.sendBtn} 
              onClick={handleSendPedido}
              disabled={isSending || pedido.trim().length === 0}
              style={{ opacity: (isSending || pedido.trim().length === 0) ? 0.6 : 1 }}
            >
              <Send size={18} />
              {isSending ? "Enviando..." : "Enviar Pedido"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.historyArea}>
        <div className={styles.historyHeader}>
          <History size={18} />
          <h2>Meus Pedidos</h2>
        </div>

        {historico.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>
            Você ainda não enviou nenhum pedido de oração.
          </p>
        ) : (
          <div className={styles.historyList}>
            {historico.map((item) => (
              <div key={item.id} className={styles.historyCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.date}>
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                  </span>
                  <span className={`${styles.status} ${item.status === 'Orado' ? styles.answered : styles.waiting}`}>
                    {item.status}
                  </span>
                </div>
                <p className={styles.requestText}>{item.texto}</p>
                <div className={styles.cardFooter}>
                  {item.uid === user.uid ? (
                    <button
                      className={styles.detailsBtn}
                      onClick={() => handleDeletePedido(item.id)}
                      style={{ color: 'var(--danger)', fontWeight: 800 }}
                    >
                      Remover
                    </button>
                  ) : (
                    <span className={styles.detailsBtn}>
                      {item.status === 'Orado' ? 'Confirmado pela Liderança' : 'Aguardando confirmação'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
