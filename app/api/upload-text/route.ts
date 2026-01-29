import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/utils";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
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
    // Get user from session
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Check usage limits BEFORE processing
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

    const body = await request.json();
    const { text, title } = body;

    if (!text || !title) {
      return NextResponse.json(
        { error: "Missing text or title" },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();

    if (trimmedText.length < 50) {
      return NextResponse.json(
        { error: "Text is too short. Minimum 50 characters required." },
        { status: 400 }
      );
    }

    // Create a text file from the content for OpenAI
    const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    const buffer = Buffer.from(trimmedText, 'utf-8');

    // Upload to OpenAI Files
    const openaiFile = await openai.files.create({
      file: await toFile(buffer, fileName),
      purpose: "assistants",
    });

    const openaiFileId = openaiFile.id;

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const storagePath = `${userId}/${timestamp}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(storagePath, buffer, {
        contentType: "text/plain",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage error:", uploadError);
      return NextResponse.json(
        { error: `Error uploading file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Insert to DB
    const { data: material, error: dbError } = await supabase
      .from("materials")
      .insert({
        user_id: userId,
        title: title,
        file_name: fileName,
        file_type: "text",
        content: trimmedText,
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
    }

    return NextResponse.json({
      success: true,
      material,
      textLength: trimmedText.length,
    });
  } catch (error) {
    console.error("Text upload error:", error);
    const msg =
      error instanceof Error ? error.message : "Unexpected upload error";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
