import { NextResponse } from "next/server";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

function generateSignature(timestamp: number, folder: string): string {
  const crypto = require("crypto");
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
    .digest("hex");
  return signature;
}

export async function POST(request: Request) {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Configuração do Cloudinary incompleta no .env.local" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;

    if (!file || !folder) {
      return NextResponse.json({ error: "Arquivo ou pasta não especificada" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(timestamp, folder);

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", `data:${file.type || "image/png"};base64,${base64}`);
    cloudinaryFormData.append("cloud_name", CLOUDINARY_CLOUD_NAME);
    cloudinaryFormData.append("api_key", CLOUDINARY_API_KEY);
    cloudinaryFormData.append("timestamp", timestamp.toString());
    cloudinaryFormData.append("folder", folder);
    cloudinaryFormData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    const data = await response.json();

    if (!data.secure_url) {
      return NextResponse.json({ error: data.error?.message || "Erro no upload" }, { status: 500 });
    }

    return NextResponse.json({
      url: data.secure_url,
      path: data.public_id,
    });
  } catch (error: any) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("path");

    if (!publicId || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: "Configuração incompleta" }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const crypto = require("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
      .digest("hex");

    const formData = new URLSearchParams();
    formData.append("public_id", publicId);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return NextResponse.json({ success: data.result === "ok" });
  } catch (error: any) {
    console.error("Erro ao deletar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}