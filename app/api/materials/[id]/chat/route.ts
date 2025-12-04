import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const body = await request.json();
    const { message, context, messages = [] } = body as {
      message: string;
      context: string;
      messages?: ChatMessage[];
    };

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    // Build system prompt with document context
    const systemPrompt = `You are an AI assistant helping students understand their study materials.

You have access to the following document content:
${context || "No document content available"}

Your tasks:
1. Answer questions about the document content
2. Explain concepts and topics from the document
3. Provide summaries when requested
4. Help clarify confusing parts
5. Give examples to help understanding

Always respond in English, be friendly, clear, and educational. Base your answers on the provided document content.`;

    // Build message history
    const openaiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Call OpenAI Chat API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const assistantMessage =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      response: assistantMessage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
