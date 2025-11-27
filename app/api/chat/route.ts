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
    const systemPrompt = `Si AI asistent, ktorý pomáha študentom s otázkami vygenerovanými z ich študijných materiálov.

Máš prístup k nasledujúcim otázkam z materiálu "${materialTitle}":
${JSON.stringify(questions, null, 2)}

Tvoje úlohy:
1. Pomôcť študentom pochopiť otázky a odpovede
2. Vysvetliť zložitejšie koncepty
3. Navrhnúť úpravy otázok ak o to požiadajú
4. Pridať nové otázky ak o to požiadajú
5. Pomôcť s prípravou na skúšku

Odpovedaj vždy v slovenčine, buď priateľský a podporujúci. Ak študent chce pridať alebo upraviť otázky, poskytni konkrétne návrhy vo formáte JSON.`;

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

    const assistantMessage = completion.choices[0]?.message?.content || "Prepáč, nedokázal som vygenerovať odpoveď.";

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
