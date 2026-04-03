"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { ChevronRight, Calendar, MapPin, Loader2, Info } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface Aviso {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  sede: string;
  imageUrl: string;
  createdAt: any;
}

export default function MuralPage() {
  const { profile } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "avisos"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const allDocs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Aviso[];

        const userSede = profile?.sede || "Geral";
        const filtered = allDocs.filter(aviso => 
          aviso.sede === "Geral" || aviso.sede === userSede
        );

        setAvisos(filtered);
        setLoading(false);
      },
      (err) => {
        if (err.code === "permission-denied") {
          setPermissionDenied(true);
          setLoading(false);
          return;
        }
        setError(err.code);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.sede]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recente";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div>
            <h1 className={styles.title}>Mural de Avisos</h1>
            <p className={styles.subtitle}>Fique por dentro das novidades da nossa comunidade.</p>
          </div>
          {profile?.sede && (
            <div className={styles.userSedeBadge}>
              <MapPin size={14} />
              <span>{profile.sede}</span>
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <p>Carregando novidades...</p>
        </div>
      ) : permissionDenied ? (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}><Info size={48} /></div>
          <h2>Nenhum aviso encontrado</h2>
          <p>Faça login para ver os avisos da sua sede ou aguarde novos avisos.</p>
        </div>
      ) : error ? (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}><Info size={48} /></div>
          <h2>Tudo tranquilo por aqui</h2>
          <p>Não há avisos específicos para sua sede no momento.</p>
        </div>
      ) : avisos.length === 0 ? (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}><Info size={48} /></div>
          <h2>Tudo tranquilo por aqui</h2>
          <p>Não há avisos específicos para sua sede no momento.</p>
        </div>
      ) : (
        <div className={styles.feed}>
          {avisos.map((aviso) => (
            <div key={aviso.id} className={styles.avisoCard}>
              <div 
                className={styles.avisoImage} 
                style={{ backgroundImage: `url(${aviso.imageUrl})` }}
              >
                <div className={styles.badgeContainer}>
                  <span className={styles.categoryBadge}>{aviso.category}</span>
                  {aviso.sede !== "Geral" && <span className={styles.sedeBadge}>{aviso.sede}</span>}
                </div>
              </div>
              <div className={styles.avisoInfo}>
                <div className={styles.dateInfo}>
                  <Calendar size={14} />
                  <span>{formatDate(aviso.createdAt)}</span>
                </div>
                <h2 className={styles.avisoTitle}>{aviso.title}</h2>
                <p className={styles.avisoExcerpt}>{aviso.excerpt}</p>
                <div className={styles.cardFooter}>
                  <button className={styles.readMore}>
                    Ler mais <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
