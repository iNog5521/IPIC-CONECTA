import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let adminApp: App;

function getFirebaseAdminApp(): App | null {
  if (getApps().length === 0) {
    if (!serviceAccountKey) {
      if (process.env.NODE_ENV === 'production') {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY não configurado.");
      }
      return null;
    }
    
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (error) {
      console.error("Erro ao processar FIREBASE_SERVICE_ACCOUNT_KEY:", error);
      return null;
    }
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

export const getAdminAuth = (): Auth | null => {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getAuth(app);
};

export const getAdminDb = (): Firestore | null => {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getFirestore(app);
};
