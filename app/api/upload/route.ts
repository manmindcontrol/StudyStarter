import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";
import { Buffer } from "buffer";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
// @ts-ignore - pdf-parse doesn't have proper types
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !openaiApiKey) {
  throw new Error(
    `Missing required environment variables: ${
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL " : ""
    }${!serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY " : ""}${
      !openaiApiKey ? "OPENAI_API_KEY" : ""
    }`
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const title = formData.get("title") as string | null;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing file or userId" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    const fileType = file.name.split(".").pop()?.toLowerCase() ?? null;

    // 🔧 Sanitize filename - remove diacritics, special chars, and spaces
    const sanitizeFilename = (filename: string): string => {
      return filename
        .normalize("NFD") // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^\w\s.-]/g, "") // Remove special characters except dots, hyphens, underscores
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/_{2,}/g, "_") // Replace multiple underscores with single
        .toLowerCase();
    };

    const sanitizedFileName = sanitizeFilename(file.name);

    // Extract text from various formats
    if (fileType === "docx" || fileType === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileType === "txt") {
      extractedText = buffer.toString("utf-8");
    } else if (fileType === "pdf") {
      // PDF: extract text using pdf-parse
      try {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        // If parsing fails, at least upload the file without text
        extractedText = "";
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // 1️⃣ Upload to OpenAI Files – so the model can work with the document
    const openaiFile = await openai.files.create({
      file: await toFile(buffer, sanitizedFileName),
      purpose: "assistants",
    });

    const openaiFileId = openaiFile.id;

    // 2️⃣ Upload to Supabase Storage
    const timestamp = Date.now();
    const storagePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage error:", uploadError);
      return NextResponse.json(
        { error: `Error uploading file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 3️⃣ Insert to DB
    const { data: material, error: dbError } = await supabase
      .from("materials")
      .insert({
        user_id: userId,
        title: title || file.name,
        file_name: file.name,
        file_type: fileType,
        content: extractedText, // extracted text from all formats (PDF, DOCX, TXT)
        storage_path: storagePath,
        openai_file_id: openaiFileId,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: `Error saving to database: ${dbError.message}` },
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
      error instanceof Error ? error.message : "Unexpected upload error";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
