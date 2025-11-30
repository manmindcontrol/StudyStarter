import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openaiApiKey = process.env.OPENAI_API_KEY!;
const openai = new OpenAI({ apiKey: openaiApiKey });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await context.params;
    const body = await request.json();
    const { message, materialContent, currentNotes } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build context for AI
    const systemPrompt = `You are an intelligent study assistant helping students understand their study materials better.

You have access to:
1. The original study material content
2. AI-generated study notes that summarize key concepts

Your role is to:
- Answer questions about the material and notes
- Clarify concepts that students find confusing
- Provide additional examples and explanations
- Help students understand connections between ideas
- Suggest study strategies for specific topics
- Expand on points in the notes when requested

Be helpful, clear, and educational. Use a friendly, encouraging tone.
If asked to modify or add to the notes, provide the additional information in a clear format that students can easily incorporate.`;

    const notesContext = `
Current Study Notes Summary:
${currentNotes.summary}

Key Points:
${currentNotes.key_points.map((p: any, i: number) => `${i + 1}. ${p.title} (${p.importance})\n   ${p.description}`).join('\n\n')}

Concepts:
${currentNotes.concepts.map((c: any, i: number) => `${i + 1}. ${c.concept}\n   ${c.explanation}\n   Examples: ${c.examples.join(', ')}`).join('\n\n')}

Study Tips:
${currentNotes.study_tips}
`;

    const materialContext = materialContent
      ? `\n\nOriginal Material Content (excerpt):\n${materialContent}`
      : "";

    // Call OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `${notesContext}${materialContext}\n\nStudent's question: ${message}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = aiResponse.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}
