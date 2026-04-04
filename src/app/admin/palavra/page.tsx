"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Sparkles, Save, RefreshCw, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

interface Palavra {
  texto: string;
  referencia: string;
  data: string;
  tipo?: string;
}

const BIBLICAL_PROMPTS = [
  "palavra sobre amor e fé",
  "palavra sobre esperança e perseverança",
  "palavra sobre comunhão e unidade na igreja",
  "palavra sobre cura e restauracao",
  "palavra sobre paz e confianca em Deus",
  "palavra sobre adoração e louvor",
  "palavra sobre famlia e relacionamentos",
  "palavra sobre evangelismo e missao",
  "palavra sobre sabedoria e conhecimento",
  "palavra sobre forca e coragem",
];

export default function AdminPalavraPage() {
  const [palavra, setPalavra] = useState<Palavra | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [editTexto, setEditTexto] = useState("");
  const [editRef, setEditRef] = useState("");

  useEffect(() => {
    const q = query(collection(db, "palavra"));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setPalavra({
          texto: docData.texto,
          referencia: docData.referencia,
          data: docData.data
        });
        setEditTexto(docData.texto);
        setEditRef(docData.referencia);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveManual = async () => {
    if (!editTexto.trim() || !editRef.trim()) {
      toast.error("Preencha a palavra e a referência bíblica.");
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, "palavra", "dia"), {
        texto: editTexto.trim(),
        referencia: editRef.trim(),
        data: new Date().toISOString().split('T')[0],
        tipo: "manual"
      });
      setManualMode(false);
      toast.success("Palavra do dia salva com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar.");
    }
    setSaving(false);
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const prompt = BIBLICAL_PROMPTS[Math.floor(Math.random() * BIBLICAL_PROMPTS.length)];
      
      const response = await fetch('/api/ai-palavra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) throw new Error('Erro na geração');
      
      const data = await response.json();
      
      await setDoc(doc(db, "palavra", "dia"), {
        texto: data.texto,
        referencia: data.referencia,
        data: new Date().toISOString().split('T')[0],
        tipo: "ia"
      });
      
      setEditTexto(data.texto);
      setEditRef(data.referencia);
      setManualMode(false);
      toast.success("Palavra gerada com IA!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar palavra com IA.");
    }
    setGeneratingAI(false);
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Palavra do Dia</h1>
        <p className={styles.subtitle}>Gerencie a palavra que aparece na página inicial.</p>
      </header>

      <div className={styles.currentCard}>
        <div className={styles.cardLabel}>Palavra Atual</div>
        {palavra ? (
          <>
            <blockquote className={styles.quote}>"{palavra.texto}"</blockquote>
            <cite className={styles.reference}>- {palavra.referencia}</cite>
            <div className={styles.metaInfo}>
              {palavra.tipo === 'ia' && <span className={styles.aiBadge}><Sparkles size={12} /> IA</span>}
              <span>Atualizada em: {palavra.data}</span>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma palavra cadastrada ainda.</p>
        )}
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.btnPrimary}
          onClick={handleGenerateAI}
          disabled={generatingAI}
        >
          {generatingAI ? (
            <>
              <Loader2 size={18} className={styles.spin} /> Gerando...
            </>
          ) : (
            <>
              <Sparkles size={18} /> Gerar com IA
            </>
          )}
        </button>
        
        <button 
          className={styles.btnSecondary}
          onClick={() => setManualMode(!manualMode)}
        >
          {manualMode ? (
            <>
              <RefreshCw size={18} /> Cancelar
            </>
          ) : (
            <>
              <Save size={18} /> Escrever Manualmente
            </>
          )}
        </button>
      </div>

      {manualMode && (
        <div className={styles.editForm}>
          <h3 className={styles.formTitle}>Editar Palavra do Dia</h3>
          <div className={styles.formGroup}>
            <label>Texto</label>
            <textarea
              value={editTexto}
              onChange={(e) => setEditTexto(e.target.value)}
              placeholder="Digite a palavra do dia..."
              rows={4}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Referência Bíblica</label>
            <input
              type="text"
              value={editRef}
              onChange={(e) => setEditRef(e.target.value)}
              placeholder="Ex: Salmos 23:1"
            />
          </div>
          <button 
            className={styles.btnSave}
            onClick={handleSaveManual}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={18} className={styles.spin} /> Salvando...
              </>
            ) : (
              <>
                <Save size={18} /> Salvar Palavra
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
