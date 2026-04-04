import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let adminApp: App;

function getFirebaseAdminApp(): App {
  if (getApps().length === 0) {
    if (!serviceAccountKey) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY não configurado no .env.local ou na Vercel");
    }
    
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (error) {
      console.error("Erro ao processar FIREBASE_SERVICE_ACCOUNT_KEY:", error);
      throw error;
    }
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

export const adminAuth: Auth = getAuth(getFirebaseAdminApp());
export const adminDb: Firestore = getFirestore(getFirebaseAdminApp());
