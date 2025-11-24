import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";
import { Buffer } from "buffer";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// server-only Supabase klient so service role (obchádza RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const title = formData.get("title") as string | null;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Chýba súbor alebo userId" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    const fileType = file.name.split(".").pop()?.toLowerCase();

    if (fileType === "pdf") {
      const { default: pdfParse } = await import("pdf-parse");
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (fileType === "docx" || fileType === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileType === "txt") {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Nepodporovaný typ súboru" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}-${file.name}`;

    // Upload do Storage
    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage error:", uploadError);
      return NextResponse.json(
        { error: `Chyba pri nahrávaní súboru: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Insert do DB
    const { data: material, error: dbError } = await supabase
      .from("materials")
      .insert({
        user_id: userId,
        title: title || file.name,
        file_name: file.name,
        file_type: fileType,
        content: extractedText,
        storage_path: fileName,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: `Chyba pri ukladaní do databázy: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      material,
      textLength: extractedText.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const msg =
      error instanceof Error ? error.message : "Neočakávaná chyba pri nahrávaní";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
