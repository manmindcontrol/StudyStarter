import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/utils";
import OpenAI from "openai";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for long audio files

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error("Missing required environment variable: OPENAI_API_KEY");
}

const supabase = createServiceRoleClient();
const openai = new OpenAI({ apiKey: openaiApiKey });

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

    // Check usage limits BEFORE transcription
    const { allowed, reason, current, limit } = await checkUsageLimit(userId, 'lectures');

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

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileName = formData.get("fileName") as string | null;
    const language = (formData.get("language") as string) || "sk";

    if (!file) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.name.split(".").pop()?.toLowerCase();
    const allowedTypes = ["mp3", "wav", "m4a", "mp4", "webm", "ogg"];

    if (!fileType || !allowedTypes.includes(fileType)) {
      return NextResponse.json(
        {
          error: `Unsupported file type. Allowed types: ${allowedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 25MB.",
        },
        { status: 400 }
      );
    }

    console.log("[Transcribe] Starting transcription for:", file.name);
    console.log("[Transcribe] File size:", (file.size / 1024 / 1024).toFixed(2), "MB");

    // Upload to Supabase Storage first
    const timestamp = Date.now();
    const storagePath = `${userId}/${timestamp}-${fileName || file.name}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("lecture-recordings")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Transcribe] Storage error:", uploadError);
      return NextResponse.json(
        { error: `Error uploading file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log("[Transcribe] File uploaded to storage:", storagePath);

    // Transcribe with OpenAI Whisper
    try {
      console.log("[Transcribe] Sending to Whisper API...");

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: language,
        response_format: "verbose_json", // Get detailed info including duration
      });

      console.log("[Transcribe] Transcription completed");
      console.log("[Transcribe] Duration:", transcription.duration, "seconds");
      console.log("[Transcribe] Text length:", transcription.text.length, "chars");

      // Save lecture to database
      const { data: lecture, error: dbError } = await supabase
        .from("lectures")
        .insert({
          user_id: userId,
          title: fileName || `Lecture ${new Date().toLocaleDateString()}`,
          transcript: transcription.text,
          duration: Math.round(transcription.duration || 0),
          audio_file_path: storagePath,
        })
        .select()
        .single();

      if (dbError) {
        console.error("[Transcribe] Database error:", dbError);

        // Cleanup: delete uploaded file if DB insert fails
        await supabase.storage
          .from("lecture-recordings")
          .remove([storagePath]);

        return NextResponse.json(
          { error: `Error saving lecture: ${dbError.message}` },
          { status: 500 }
        );
      }

      // Increment usage counter AFTER successful save
      try {
        await incrementUsage(userId, 'lectures');
      } catch (usageError) {
        console.error("[Transcribe] Error incrementing usage:", usageError);
        // Don't fail the request if usage increment fails
      }

      console.log("[Transcribe] Success! Lecture ID:", lecture.id);

      return NextResponse.json({
        success: true,
        lecture,
        transcript: transcription.text,
        duration: Math.round(transcription.duration || 0),
      });
    } catch (whisperError) {
      console.error("[Transcribe] Whisper API error:", whisperError);

      // Cleanup: delete uploaded file if transcription fails
      await supabase.storage
        .from("lecture-recordings")
        .remove([storagePath]);

      const errorMessage =
        whisperError instanceof Error
          ? whisperError.message
          : "Unknown transcription error";

      return NextResponse.json(
        {
          error: `Transcription failed: ${errorMessage}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Transcribe] Unexpected error:", error);
    const msg =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
