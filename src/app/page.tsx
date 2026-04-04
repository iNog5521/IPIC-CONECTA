"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { CheckCircle, Info, MessageSquare, MapPin, Clock, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

interface Sede {
  id: string;
  nome: string;
  endereco: string;
  active: boolean;
}

interface Culto {
  id: string;
  name: string;
  description: string;
  day: string;
  time: string;
  sede: string;
  active: boolean;
}

export default function Home() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [palavra, setPalavra] = useState<{texto: string; referencia: string} | null>(null);

  useEffect(() => {
    const qSedes = query(collection(db, "sedes"));
    const unsubSedes = onSnapshot(qSedes, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sede[];
      setSedes(docs.filter((s: Sede) => s.active));
    }, (err) => {
      // Silenciar erros de permissão
    });

    const qCultos = query(collection(db, "cultos"));
    const unsubCultos = onSnapshot(qCultos, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Culto[];
      setCultos(docs.filter((c: Culto) => c.active));
    }, (err) => {
      // Silenciar erros de permissão
    });

    const qPalavra = query(collection(db, "palavra"));
    const unsubPalavra = onSnapshot(qPalavra, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setPalavra({
          texto: docData.texto,
          referencia: docData.referencia
        });
      }
    }, (err) => {
      // Silenciar erros de permissão
    });

    return () => {
      unsubSedes();
      unsubCultos();
      unsubPalavra();
    };
  }, []);

  return (
    <div className={styles.page}>
      {/* Dobra 1: Hero Section - Palavra do Dia */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Palavra do Dia</span>
            <h1 className={styles.heroText}>
              "{palavra?.texto || "O Senhor é o meu pastor e nada me faltará."}"
            </h1>
            <p className={styles.heroRef}>- {palavra?.referencia || "Salmos 23:1"}</p>
          </div>
        </div>
      </section>

      <div className={styles.contentContainer}>
        {/* Ação de Presença */}
        <section className={styles.actionSection}>
          <Link href="/cultos" className={styles.presenceButton}>
            <CheckCircle size={20} />
            Confirmar Presença no Culto
          </Link>
        </section>

        {/* Dobra 2: Próximos Cultos */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Calendar size={18} className={styles.sectionIcon} />
            <h2>Próximos Cultos</h2>
            <Link href="/cultos" className={styles.seeAll} prefetch={false}>Ver todos</Link>
          </div>
          
          {cultos.length === 0 ? (
            <div style={{ 
              background: 'var(--surface)', borderRadius: '16px', padding: '2rem', 
              border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' 
            }}>
              <Calendar size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>Nenhum culto cadastrado.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              overflow: 'hidden',
              padding: '0.25rem 0 0.5rem 0',
              scrollbarWidth: 'none'
            }}>
              {cultos.length > 1 ? (
                <div style={{ display: 'flex', animation: 'scrollCultos 20s linear infinite', width: 'fit-content' }}>
                  {[...cultos, ...cultos].map((culto, idx) => (
                    <div key={`${culto.id}-${idx}`} style={{
                      width: '280px',
                      flexShrink: 0,
                      background: 'var(--surface)',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      marginRight: '1rem'
                    }}>
                      <div style={{ 
                        padding: '0.75rem 1rem', 
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} style={{ color: 'white' }} />
                          <span style={{ color: 'white', fontWeight: '600', fontSize: '0.75rem' }}>{culto.day}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} style={{ color: 'white' }} />
                          <span style={{ color: 'white', fontWeight: '700', fontSize: '0.8rem' }}>{culto.time}</span>
                        </div>
                      </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                      {culto.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.8em' }}>
                      {culto.description}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                      <MapPin size={10} /> {culto.sede}
                    </span>
                  </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  width: '280px',
                  background: 'var(--surface)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  flexShrink: 0
                }}>
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} style={{ color: 'white' }} />
                      <span style={{ color: 'white', fontWeight: '600', fontSize: '0.75rem' }}>{cultos[0].day}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} style={{ color: 'white' }} />
                      <span style={{ color: 'white', fontWeight: '700', fontSize: '0.8rem' }}>{cultos[0].time}</span>
                    </div>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                      {cultos[0].name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.8em' }}>
                      {cultos[0].description}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                      <MapPin size={12} /> {cultos[0].sede}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Dobra 3: Pedidos & Sedes */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MessageSquare size={18} className={styles.sectionIcon} />
            <h2>Pedidos de Oração</h2>
          </div>
          <div className={styles.prayerCard}>
            <div className={styles.prayerImage}></div>
            <div className={styles.prayerContent}>
              <p>Compartilhe sua necessidade e nossa comunidade orará por você.</p>
              <Link href="/oracoes" className={styles.prayerRequestButton}>
                Enviar novo pedido
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MapPin size={18} className={styles.sectionIcon} />
            <h2>Nossas Sedes</h2>
          </div>
          <div className={styles.sedesGrid}>
            {sedes.length > 0 ? (
              sedes.map((sede) => (
                <div key={sede.id} className={styles.sedeCard}>
                  <h4>{sede.nome}</h4>
                  <p>{sede.endereco || "Endereço não informado"}</p>
                </div>
              ))
            ) : (
              <>
                <div className={styles.sedeCard}>
                  <h4>Sede Central</h4>
                  <p>Rua Principal, 100 - Centro</p>
                </div>
                <div className={styles.sedeCard}>
                  <h4>Sede Norte</h4>
                  <p>Avenida Norte, 500 - Bairro Novo</p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
