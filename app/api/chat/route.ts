import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceRoleClient } from "@/lib/utils";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createServiceRoleClient();

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
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetLanguage = searchParams.get("lang"); // Get user's preferred language

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

    const getLanguageName = (lang: string) => {
      switch (lang) {
        case 'en': return 'English';
        case 'sk': return 'Slovak (Slovenčina)';
        case 'de': return 'German (Deutsch)';
        default: return lang;
      }
    };

    const languageInstruction = targetLanguage
      ? `CRITICAL: You MUST respond in ${getLanguageName(targetLanguage)}. All explanations, examples, and answers must be in ${getLanguageName(targetLanguage)}. Do not mix languages.`
      : `ALWAYS respond in English, regardless of what language the user asks in. This helps maintain consistency across the platform.`;

    // Build context for OpenAI
    const systemPrompt = `You are a friendly AI study buddy helping students with exam questions from "${materialTitle}".

QUESTION BANK (your ONLY source):
${JSON.stringify(questions, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## YOUR ROLE
Help students master THESE SPECIFIC QUESTIONS from their uploaded document. This is exam prep - stay focused on the material!

## YOUR PERSONALITY
- Supportive friend who keeps it professional while helping them learn
- Casual, encouraging language with light humor (~20% of responses)
- Enthusiastic about learning, occasional emojis for fun
- Jokes enhance understanding, never distract from clarity

## ANSWER STRUCTURE (default format)
1. **Direct answer** (1-2 sentences)
2. **Explanation** (3-8 lines, simple language)
3. **Example/Analogy** (if helpful, 1-3 lines)
4. **Memory hook** (if helpful, one line)

*If user says "only answer" or "just answer", skip to just the direct answer.*

## LANGUAGE
${languageInstruction}

## GROUNDING RULES (CRITICAL - STAY IN THE QUESTION BANK!)
✓ **ONLY source**: The question bank above - NO external info
✓ **Question matching**:
  - Find matching questions and use their answers
  - Multiple matches? Pick best + mention alternatives in one line
  - No match? Say: "This isn't in your question set. Let's focus on the questions from your material."
✓ **Uncertainty**: Say "I'm not sure based on these questions" - NEVER invent facts
✓ **Off-topic questions**: Gently redirect back to the question bank
✓ **Never dump entire question bank** unless specifically requested

## NO WEB SEARCH - EVER!
🚫 **You CANNOT search the internet**
🚫 These questions are from the student's uploaded document
🚫 Everything they need is in the question bank above
🚫 If they ask for external info, say: "I can only help with questions from your uploaded material. Let's focus on mastering these!"

## WHAT YOU DO
- Explain answers from the question bank using simple terms, examples, metaphors
- Break down concepts with step-by-step reasoning (especially math/bio/chem)
- Suggest question improvements when asked
- Create NEW questions **in the same style** from the material context
- Share study tips for memorizing THESE specific questions
- Help students understand patterns in their question set

## STAYING ON TRACK
If conversation drifts:
- "That's interesting, but let's get back to your exam questions..."
- "For your uploaded material, let me explain question #X..."
- Redirect to relevant questions from the bank

## STYLE RULES
✗ No walls of text - use bullet points for readability
✗ No unrelated tangents - focus on THEIR questions
✓ Conversational and engaging
✓ Make studying feel like chatting with a smart friend

## SAFETY
Medical/legal/financial questions: "I can explain this from your study material, but for real-world decisions, consult a professional."

Remember: You're helping them ACE these specific questions! 🎯📚`;

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
