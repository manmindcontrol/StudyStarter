import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";

// 🔐 Environment keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

// 🔧 Supabase service client (server only)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 🤖 OpenAI
const openai = new OpenAI({ apiKey: openaiApiKey });

// --- Types -------------------------------------------------------

type QuestionType = "exam" | "test" | "summary";

type GeneratedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
};

// Typ bezpečného výsledku OpenAI Responses API
type OpenAIResponseLike = {
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  output_text?: string;
};

function isOpenAIResponseLike(value: unknown): value is OpenAIResponseLike {
  if (typeof value !== "object" || value === null) return false;

  const obj = value as Record<string, unknown>;

  if ("output" in obj && Array.isArray(obj.output)) return true;
  if ("output_text" in obj && typeof obj.output_text === "string") return true;

  return false;
}

// --- API Route ---------------------------------------------------

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const materialId = context.params.id;
    const { searchParams } = new URL(request.url);

    const questionType = (searchParams.get("type") as QuestionType) || "exam";
    const targetLanguage = searchParams.get("lang"); // user can request output lang

    // 1️⃣ Load material
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("id, user_id, title, openai_file_id, content")
      .eq("id", materialId)
      .single();

    if (materialError || !material) {
      return NextResponse.json(
        { error: "Material not found." },
        { status: 404 }
      );
    }

    if (!material.openai_file_id) {
      return NextResponse.json(
        { error: "This material does not have an OpenAI file." },
        { status: 400 }
      );
    }

    // 2️⃣ Build prompts
    const baseInstruction =
      questionType === "exam"
        ? "Generate around 15 challenging, exam-style questions."
        : questionType === "test"
        ? "Generate around 20 multiple-choice test questions (4 options, 1 correct)."
        : "Generate mixed review questions (both open and MCQ) to help understand the material.";

    const languageInstruction = targetLanguage
      ? `Use ${targetLanguage} for all questions and answers.`
      : `If no specific language is requested, use the dominant language of the document.`;

    const systemPrompt = `
You are an assistant that generates high-quality study questions from academic documents.
Your output must ALWAYS be a pure JSON array—no explanations, no descriptions outside JSON.

${languageInstruction}

Each JSON object must be:
{
  "question": "string",
  "type": "open" | "mcq",
  "options": ["A", "B", "C", "D"] | null,
  "answer": "string or explanation" | null
}
`;

    const userPrompt = `
Material title: "${material.title}"

Task:
${baseInstruction}

Additional rules:
- Cover different sections of the document.
- Include conceptual and applied questions.
- For MCQ: always 3–5 options, only one correct.
- No text outside JSON.
`;

    // 3️⃣ Call OpenAI (responses.create — WITHOUT response_format!)
    const aiResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [
            { type: "input_file", file_id: material.openai_file_id },
            { type: "input_text", text: userPrompt },
          ],
        },
      ],
    });

    // 4️⃣ Extract text safely (no `any`)
    if (!isOpenAIResponseLike(aiResponse)) {
      return NextResponse.json(
        { error: "Invalid OpenAI response format." },
        { status: 500 }
      );
    }

    let jsonText: string | undefined;

    if (
      aiResponse.output &&
      aiResponse.output[0]?.content &&
      aiResponse.output[0].content[0]?.text
    ) {
      jsonText = aiResponse.output[0].content[0].text;
    } else if (typeof aiResponse.output_text === "string") {
      jsonText = aiResponse.output_text;
    }

    if (!jsonText) {
      console.error("OpenAI response:", aiResponse);
      return NextResponse.json(
        { error: "Could not extract text from OpenAI response." },
        { status: 500 }
      );
    }

    // 5️⃣ Parse JSON
    let questions: GeneratedQuestion[];

    try {
      questions = JSON.parse(jsonText) as GeneratedQuestion[];
    } catch (err) {
      console.error("JSON parse error:", jsonText);
      return NextResponse.json(
        { error: "OpenAI did not return valid JSON." },
        { status: 500 }
      );
    }

    // 6️⃣ Save to DB
    const { data: inserted, error: insertError } = await supabase
      .from("generated_questions")
      .insert({
        material_id: material.id,
        user_id: material.user_id,
        question_type: questionType,
        questions,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save generated questions." },
        { status: 500 }
      );
    }

    // 7️⃣ Done
    return NextResponse.json({
      success: true,
      questions,
      record: inserted,
    });
  } catch (error) {
    console.error("Generate Questions Error:", error);
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
