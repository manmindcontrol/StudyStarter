import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30; // Maximum 30 seconds for formatting

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error("Missing required environment variable: OPENAI_API_KEY");
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Transcript text is required" },
        { status: 400 }
      );
    }

    if (transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "Transcript cannot be empty" },
        { status: 400 }
      );
    }

    // Use OpenAI to add proper punctuation and formatting
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional transcription editor. Your job is to:
1. Add proper punctuation (periods, commas, question marks, exclamation marks)
2. Fix capitalization (capitalize first letter of sentences and proper nouns)
3. Break text into clear sentences and paragraphs where appropriate
4. Remove duplicate words or phrases that occur due to speech recognition errors
5. Keep the original wording and meaning - do NOT paraphrase or change content
6. Output ONLY the formatted text, nothing else

IMPORTANT: Do NOT add any commentary, explanations, or notes. Just return the clean, formatted transcript.`,
        },
        {
          role: "user",
          content: `Format this transcript by adding punctuation and proper capitalization:\n\n${transcript}`,
        },
      ],
      temperature: 0.2, // Lower temperature for more consistent formatting
      max_tokens: 4000,
      stream: false, // Ensure we get complete response
    });

    const formattedText = completion.choices[0]?.message?.content?.trim();

    if (!formattedText) {
      return NextResponse.json(
        { error: "Failed to format transcript" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      formattedTranscript: formattedText,
      originalLength: transcript.length,
      formattedLength: formattedText.length,
    });
  } catch (error) {
    console.error("Transcript formatting error:", error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes("rate_limit")) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      if (error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Formatting took too long. Try with shorter text." },
          { status: 408 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Unexpected error while formatting transcript" },
      { status: 500 }
    );
  }
}
