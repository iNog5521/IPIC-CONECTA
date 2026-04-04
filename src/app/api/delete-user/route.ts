import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 });
    }

    try {
      await adminAuth.deleteUser(userId);
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
