import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function getFirebaseAdminApp(): App | null {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (!serviceAccountKey) {
    return null;
  }
  
  try {
    let sanitizedKey = serviceAccountKey.trim();
    
    // Remove aspas simples ou duplas externas que podem vir do .env.local
    if ((sanitizedKey.startsWith("'") && sanitizedKey.endsWith("'")) || 
        (sanitizedKey.startsWith('"') && sanitizedKey.endsWith('"'))) {
      sanitizedKey = sanitizedKey.substring(1, sanitizedKey.length - 1);
    }
    
    // Fallback: se ainda estiver "sujo" com escapes de barras, limpa
    if (sanitizedKey.includes('\\"')) {
      sanitizedKey = sanitizedKey.split('\\"').join('"').split('\\\\n').join('\n');
    }

    return initializeApp({
      credential: cert(JSON.parse(sanitizedKey))
    });
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error);
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
