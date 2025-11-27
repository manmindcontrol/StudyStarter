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

// --- API Route ---------------------------------------------------

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await context.params;
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
Your output must ALWAYS be valid JSON in this exact format:

{
  "questions": [
    {
      "question": "string",
      "type": "open" | "mcq",
      "options": ["A", "B", "C", "D"] | null,
      "answer": "string or explanation" | null
    }
  ]
}

${languageInstruction}

Rules:
- Return ONLY valid JSON, no explanations outside JSON
- The root object must have a "questions" array
- Each question must have all required fields
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

    // 3️⃣ Call OpenAI (using standard Chat Completion API)
    // Note: Since we have content extracted, we'll use it directly
    // If you want to use file_id, you'd need to use the Assistants API instead
    const contentToAnalyze = material.content || "No content available";

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `${userPrompt}\n\nDocument content:\n${contentToAnalyze.substring(0, 15000)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // 4️⃣ Extract text safely
    const jsonText = aiResponse.choices[0]?.message?.content;

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
      const parsed = JSON.parse(jsonText) as { questions: GeneratedQuestion[] };
      questions = parsed.questions;

      if (!Array.isArray(questions)) {
        throw new Error("Questions is not an array");
      }
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
