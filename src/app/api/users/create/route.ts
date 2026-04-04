import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { UserProfile } from "@/types";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userData = await request.json() as UserProfile;

    if (!userData.uid || !userData.email) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Lógica de atribuição de cargo no servidor (Segurança)
    const isOwner = userData.email.toLowerCase() === "inog5521@gmail.com";
    const role = isOwner ? "owner" : "user";

    const finalUserData: UserProfile = {
      ...userData,
      role: role,
      email: userData.email.toLowerCase(),
      createdAt: userData.createdAt || new Date().toISOString()
    };

    // Salvar no Firestore via Admin SDK
    const db = getAdminDb();
    if (!db) {
      console.error("❌ Erro: getAdminDb() retornou null na API de criação.");
      throw new Error("Serviço de banco de dados não disponível (Erro na inicialização do Admin SDK).");
    }
    await db.collection("users").doc(userData.uid).set(finalUserData);

    console.log(`Perfil criado com sucesso via API para UID: ${userData.uid} (Cargo: ${role})`);

    return NextResponse.json({ 
      success: true, 
      role: role 
    });
  } catch (error: any) {
    console.error("Erro na API de criação de usuário:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
