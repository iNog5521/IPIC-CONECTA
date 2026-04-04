import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function getFirebaseAdminApp(): App | null {
  // Já está inicializado?
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY não encontrada no ambiente.");
    return null;
  }

  try {
    let config: any;

    // TENTATIVA 1: Parse direto (já pode ser um JSON válido)
    try {
      config = JSON.parse(serviceAccountKey);
    } catch (e) {
      // TENTATIVA 2: Limpeza profunda para ambientes de produção (Vercel/Docker)
      let sanitized = serviceAccountKey.trim();

      // Remove aspas simples ou duplas externas (vêm de arquivos .env)
      if ((sanitized.startsWith("'") && sanitized.endsWith("'")) || 
          (sanitized.startsWith('"') && sanitized.endsWith('"'))) {
        sanitized = sanitized.substring(1, sanitized.length - 1);
      }

      // Corrige escapes de quebras de linha (comum na chave privada)
      sanitized = sanitized.replace(/\\n/g, '\n');

      // Corrige aspas triplas ou duplas que podem persistir
      if (sanitized.includes('\\"')) {
        sanitized = sanitized.replace(/\\"/g, '"');
      }

      config = JSON.parse(sanitized);
    }

    // Google Cloud Service Account JSON usa snake_case (private_key, client_email)
    const privateKey = config.private_key || config.privateKey;
    const clientEmail = config.client_email || config.clientEmail;

    if (!privateKey || !clientEmail) {
      console.error("❌ A chave do Firebase Admin parece estar incompleta (faltando private_key ou client_email).");
      return null;
    }

    // Normalização extra da privateKey para garantir que \n sejam quebras reais
    if (typeof privateKey === 'string') {
      config.private_key = privateKey.replace(/\\n/g, '\n');
    }

    return initializeApp({
      credential: cert(config)
    });
  } catch (error) {
    console.error("❌ Erro fatal ao inicializar Firebase Admin:", error);
    return null;
  }
}

export const getAdminAuth = (): Auth | null => {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
};

export const getAdminDb = (): Firestore | null => {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
};
