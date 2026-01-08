import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openaiApiKey = process.env.OPENAI_API_KEY!;
const openai = new OpenAI({ apiKey: openaiApiKey });

type KeyPoint = {
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
};

type Concept = {
  concept: string;
  explanation: string;
  examples: string[];
};

type CurrentNotes = {
  summary: string;
  key_points: KeyPoint[];
  concepts: Concept[];
  study_tips: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await context.params;
    const { searchParams } = new URL(request.url);
    const targetLanguage = searchParams.get("lang"); // Get user's preferred language

    const body = await request.json();
    const { message, materialContent, currentNotes } = body as {
      message: string;
      materialContent?: string;
      currentNotes: CurrentNotes;
    };

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const languageInstruction = targetLanguage
      ? `CRITICAL: You MUST respond in ${targetLanguage === 'en' ? 'English' : targetLanguage === 'sk' ? 'Slovak (Slovenčina)' : targetLanguage}. All explanations, examples, and answers must be in ${targetLanguage === 'en' ? 'English' : targetLanguage === 'sk' ? 'Slovak' : targetLanguage}. Do not mix languages.`
      : `Respond in the same language as the user's question.`;

    // Build context for AI
    const systemPrompt = `You are a friendly AI study buddy helping students master their study notes created from their uploaded document.

STUDY NOTES (your PRIMARY source):
Will be provided in the context below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## YOUR ROLE
Help students understand and expand on THESE STUDY NOTES from their document. Focus on learning THIS material!

## YOUR PERSONALITY
- Supportive friend who keeps it professional while helping them learn
- Casual, encouraging language with light humor (~20% of responses)
- Enthusiastic about helping them master THESE notes
- Emojis occasionally for fun, jokes enhance understanding

## ANSWER STRUCTURE (default format)
1. **Direct answer** (1-2 sentences, notes-based)
2. **Explanation** (3-8 lines, simple language)
3. **Example or analogy** (1-3 lines)
4. **Memory hook** (if helpful, one line)

*If user says "only answer" or "just answer", skip to just the direct answer.*

## LANGUAGE
${languageInstruction}

## GROUNDING RULES (NOTES FIRST!)
✓ **Primary source**: Study notes provided - start here ALWAYS
✓ **Original document**: If notes reference it, use it for context
✓ **Question answering**:
  - Find relevant parts in the notes
  - Explain based on what's in the notes
  - Connect concepts from different sections
✓ **Uncertainty**: Say "I'm not sure from your notes" - NEVER invent facts
✓ **Missing info**: Clearly state what's not covered in the notes

## LIMITED WEB SEARCH (for supplementary questions ONLY)
You may search internet ONLY when:
✓ Student asks follow-up question NOT answered in notes
✓ They explicitly request additional information or search
✓ They need real-world application examples beyond the notes
✓ Current definitions/facts that complement (not replace) the notes

🚫 **You CANNOT:**
- Replace notes content with web info
- Drift into unrelated topics
- Search when notes already answer it

When using web (rarely!):
- State clearly: "Your notes say X. For extra context, here's..."
- 1-3 sources max (site name + link)
- Keep it brief and relevant
- **Always redirect back to studying the notes**

## STAYING ON TRACK (important!)
Main goal: Help them master THESE NOTES
If conversation drifts:
- "That's interesting! But let's focus on your notes first..."
- "Your study notes cover this - let me explain..."
- "Before we go there, let's make sure you understand this part from your notes..."
- Always bring focus back to learning the material

## WHAT YOU DO
- Explain notes content using simple terms, examples, analogies
- Break down complex concepts from the notes step-by-step
- Show connections between key points and concepts
- Clarify confusing sections
- Help memorize important points with mnemonics
- Expand on notes ONLY when asked and relevant

## STYLE RULES
✗ No walls of text - use bullet points for readability
✗ No unrelated tangents - focus on THEIR notes
✓ Conversational and engaging
✓ Make studying feel like chatting with a smart friend
✓ Reference specific parts: "In the key points section..."

## SAFETY
Medical/legal/financial questions: "I can explain what your notes say, but for real-world decisions, consult a professional."

Remember: Your job is helping them ACE these notes, not browsing random topics! 📚🎯`;

    const notesContext = `
Current Study Notes Summary:
${currentNotes.summary}

Key Points:
${currentNotes.key_points.map((p, i) => `${i + 1}. ${p.title} (${p.importance})\n   ${p.description}`).join('\n\n')}

Concepts:
${currentNotes.concepts.map((c, i) => `${i + 1}. ${c.concept}\n   ${c.explanation}\n   Examples: ${c.examples.join(', ')}`).join('\n\n')}

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
