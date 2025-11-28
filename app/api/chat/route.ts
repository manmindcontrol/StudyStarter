import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type GeneratedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, questions, materialTitle } = body as {
      messages: ChatMessage[];
      questions: GeneratedQuestion[];
      materialTitle: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Build context for OpenAI
    const systemPrompt = `You are an AI assistant helping students with questions generated from their study materials.

You have access to the following questions from the material "${materialTitle}":
${JSON.stringify(questions, null, 2)}

Your tasks:
1. Help students understand the questions and answers
2. Explain complex concepts
3. Suggest question modifications if requested
4. Add new questions if requested
5. Help with exam preparation

Always respond in English, be friendly and supportive. If a student wants to add or modify questions, provide specific suggestions in JSON format.`;

    // Convert chat messages to OpenAI format
    const openaiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content
      }))
    ];

    // Call OpenAI Chat API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
