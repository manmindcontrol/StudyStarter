import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceRoleClient } from "@/lib/utils";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createServiceRoleClient();

// Get file extension from MIME type
function getExtensionFromMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  return "webm";
}

// Real-time lecture recording is TEMPORARILY DISABLED.
// Set to true (or remove the guard below) to re-enable this endpoint.
const REALTIME_TRANSCRIPTION_ENABLED = false;

export async function POST(request: NextRequest) {
  if (!REALTIME_TRANSCRIPTION_ENABLED) {
    return NextResponse.json(
      { error: "Real-time transcription is temporarily unavailable" },
      { status: 503 }
    );
  }

  let tempFilePath: string | null = null;

  try {
    // Auth check
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob | null;
    const language = (formData.get("language") as string) || "sk";

    if (!audioBlob) {
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 }
      );
    }

    // Get file extension from MIME type
    const mimeType = audioBlob.type || "audio/webm";
    const extension = getExtensionFromMime(mimeType);

    // Create temp file path
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `audio-${Date.now()}.${extension}`);

    // Write blob to temp file
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    // Language-specific prompts
    const prompts: Record<string, string> = {
      sk: "Toto je prepis prednášky alebo hovoreného slova v slovenčine. Používaj správnu interpunkciu a veľké písmená.",
      en: "This is a lecture or spoken word transcription in English. Use proper punctuation and capitalization.",
      de: "Dies ist eine Transkription eines Vortrags oder gesprochenen Wortes auf Deutsch. Verwende korrekte Zeichensetzung und Großschreibung.",
    };

    // Create read stream for OpenAI
    const fileStream = fs.createReadStream(tempFilePath);

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
      language: language,
      response_format: "json",
      prompt: prompts[language] || prompts.sk,
    });

    return NextResponse.json({
      success: true,
      text: transcription.text,
    });
  } catch (error) {
    console.error("[Transcribe Realtime] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Transcription failed";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Cleanup temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
