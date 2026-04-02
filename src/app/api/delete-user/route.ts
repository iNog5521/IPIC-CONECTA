import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    if (!serviceAccountKey) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY não configurado");
    }
    const serviceAccount = JSON.parse(serviceAccountKey);
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  return getAuth();
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 });
    }

    const auth = getFirebaseAdmin();

    try {
      await auth.deleteUser(userId);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log("Usuário não encontrado no Auth, continuando para excluir do Firestore...");
      } else {
        throw authError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
