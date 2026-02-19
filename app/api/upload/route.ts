import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { Buffer } from "buffer";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
// @ts-expect-error - pdf-parse doesn't have proper types
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { createServiceRoleClient, sanitizeFilename } from "@/lib/utils";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";

export const runtime = "nodejs";

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error("Missing required environment variable: OPENAI_API_KEY");
}

const supabase = createServiceRoleClient();

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export async function POST(request: NextRequest) {
  try {
    // Get user from session instead of accepting from client
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Check usage limits BEFORE processing file
    const { allowed, reason, current, limit } = await checkUsageLimit(userId, 'materials');

    if (!allowed) {
      return NextResponse.json(
        {
          error: reason || 'Usage limit exceeded',
          current,
          limit,
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    const fileType = file.name.split(".").pop()?.toLowerCase() ?? null;

    const sanitizedFileName = sanitizeFilename(file.name);

    // Extract text from various formats
    if (fileType === "docx") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (docxError) {
        console.error("DOCX parsing error:", docxError);
        return NextResponse.json(
          { error: "Failed to extract text from DOCX. The file might be corrupted." },
          { status: 400 }
        );
      }
    } else if (fileType === "doc") {
      return NextResponse.json(
        { error: "Old .doc format is not supported. Please convert your file to .docx, .pdf, or .txt and try again." },
        { status: 400 }
      );
    } else if (fileType === "txt") {
      extractedText = buffer.toString("utf-8");
    } else if (fileType === "pdf") {
      // PDF: extract text using pdf-parse
      try {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        const errorMessage = pdfError instanceof Error ? pdfError.message : "Unknown error";

        return NextResponse.json(
          {
            error: `Failed to extract text from PDF: ${errorMessage}. The PDF might be corrupted, password-protected, or use unsupported features.`,
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Validate that we extracted meaningful content
    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        {
          error: "No text content found in the file. The file might be empty, scanned images, or encrypted. Try a different format.",
        },
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

    // Increment usage counter AFTER successful upload
    try {
      await incrementUsage(userId, 'materials');
    } catch (usageError) {
      console.error("Error incrementing usage:", usageError);
      // Don't fail the request if usage increment fails
      // Material was uploaded successfully
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
