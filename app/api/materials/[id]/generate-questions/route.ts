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
    const questionCount = parseInt(searchParams.get("count") || "10", 10); // default 10
    const questionFormat = searchParams.get("format") || "mixed"; // mcq, open, mixed

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

    // 2️⃣ Build prompts based on user preferences
    let formatInstruction = "";
    if (questionFormat === "mcq") {
      formatInstruction = `Generate ONLY multiple-choice questions (MCQ) with 4 options (A, B, C, D), where only one is correct.`;
    } else if (questionFormat === "open") {
      formatInstruction = `Generate ONLY open-ended questions that require detailed written answers.`;
    } else {
      formatInstruction = `Generate a MIX of both multiple-choice (MCQ) and open-ended questions. Aim for roughly 50/50 split.`;
    }

    const languageInstruction = targetLanguage
      ? `Use ${targetLanguage} for all questions and answers.`
      : `If no specific language is requested, use the dominant language of the document.`;

    const systemPrompt = `
You are an assistant that generates high-quality study questions from academic documents.
Your output must ALWAYS be valid JSON in this exact format:

{
  "questions": [
    {
      "question": "What is photosynthesis?",
      "type": "mcq",
      "options": [
        "Process of breaking down food",
        "Process plants use to make food from sunlight",
        "Process of cellular respiration",
        "Process of water absorption"
      ],
      "answer": "b) Process plants use to make food from sunlight - This is correct because photosynthesis is the biological process by which plants convert light energy into chemical energy."
    }
  ]
}

NOTICE in the example above:
- options array contains ONLY the text, NO letters
- answer field contains: letter + full option text + explanation

${languageInstruction}

IMPORTANT RULES:
- Return ONLY valid JSON, no explanations outside JSON
- The root object must have a "questions" array
- Each question must have all required fields
- For MCQ questions: type="mcq", options must be an array of 4 strings (ONLY the option text, NO letters like "a)" in the options array)
- For MCQ answer field: MUST include letter + FULL TEXT of the correct option + explanation
- Example: If option at index 1 (b) says "Photosynthesis is the process", answer MUST be: "b) Photosynthesis is the process - This is correct because..."
- CRITICAL: NEVER put just a letter (like "a" or "b") in the answer field - ALWAYS include letter + full option text + explanation
- For open questions: type="open", options=null, answer must contain a detailed correct answer
- ALWAYS include the correct answer in the "answer" field for learning purposes
- Use lowercase letters (a, b, c, d) for MCQ answer format, NOT uppercase (A, B, C, D)
`;

    const userPrompt = `
Material title: "${material.title}"

Task:
Generate EXACTLY ${questionCount} questions from this educational material.

Question Format Requirements:
${formatInstruction}

Additional rules:
- Cover different sections of the document
- Include both conceptual and applied questions
- Vary difficulty levels (easy, medium, hard)
- For MCQ: always exactly 4 options, only one correct
- For MCQ: in the "answer" field, MUST follow this format: "letter) full option text - explanation why it's correct"
- Example answer format: "c) The correct option text goes here - This is correct because it explains the concept..."
- CRITICAL ERROR TO AVOID: Do NOT write just "c)" or just "c) Explanation" - you MUST include the full option text between the letter and the dash
- For open questions: provide a comprehensive correct answer
- No text outside JSON
- Make questions challenging but fair
- IMPORTANT: Use lowercase letters (a, b, c, d) in answers, NOT uppercase (A, B, C, D)
`;

    // 3️⃣ Call OpenAI (using standard Chat Completion API)
    // Note: Since we have content extracted, we'll use it directly
    // If you want to use file_id, you'd need to use the Assistants API instead
    const contentToAnalyze = material.content || "No content available";

    // Adjust content limit based on question count - increased for longer documents
    const contentLimit = questionCount > 20 ? 150000 : questionCount > 10 ? 100000 : 80000;

    // 4️⃣ Generate questions (split into batches if count > 15 to avoid token limits)
    let questions: GeneratedQuestion[] = [];

    if (questionCount > 15) {
      // Split into two batches with different document sections
      const firstBatch = Math.ceil(questionCount / 2);
      const secondBatch = questionCount - firstBatch;

      // Split document content for better coverage
      const halfPoint = Math.floor(contentToAnalyze.length / 2);
      const firstHalfContent = contentToAnalyze.substring(0, halfPoint);
      const secondHalfContent = contentToAnalyze.substring(halfPoint, contentLimit);

      // Generate first batch from first half
      const firstPrompt = userPrompt.replace(
        `Generate EXACTLY ${questionCount} questions`,
        `Generate EXACTLY ${firstBatch} questions from this section of the document`
      );

      const firstResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${firstPrompt}\n\nDocument content:\n${firstHalfContent}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 10000,
      });

      const firstJson = firstResponse.choices[0]?.message?.content;
      if (firstJson) {
        const firstParsed = JSON.parse(firstJson) as { questions: GeneratedQuestion[] };
        questions.push(...firstParsed.questions);
      }

      // Generate second batch from second half
      const secondPrompt = userPrompt.replace(
        `Generate EXACTLY ${questionCount} questions`,
        `Generate EXACTLY ${secondBatch} questions from this section of the document. Make sure these are DIFFERENT from any previous questions.`
      );

      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${secondPrompt}\n\nDocument content:\n${secondHalfContent}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 10000,
      });

      const secondJson = secondResponse.choices[0]?.message?.content;
      if (secondJson) {
        const secondParsed = JSON.parse(secondJson) as { questions: GeneratedQuestion[] };
        questions.push(...secondParsed.questions);
      }

      // If we're still short, generate missing questions
      if (questions.length < questionCount) {
        const missing = questionCount - questions.length;
        const fillPrompt = userPrompt.replace(
          `Generate EXACTLY ${questionCount} questions`,
          `Generate EXACTLY ${missing} additional questions from the document. Make sure these are DIFFERENT from any previous questions.`
        );

        const fillResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${fillPrompt}\n\nDocument content:\n${contentToAnalyze.substring(0, contentLimit)}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.8, // Slightly higher temperature for variety
          max_tokens: 4000,
        });

        const fillJson = fillResponse.choices[0]?.message?.content;
        if (fillJson) {
          const fillParsed = JSON.parse(fillJson) as { questions: GeneratedQuestion[] };
          // Only take exactly the number we need to avoid exceeding the requested count
          const neededQuestions = fillParsed.questions.slice(0, missing);
          questions.push(...neededQuestions);
        }
      }
    } else {
      // Single batch for 15 or fewer questions
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${userPrompt}\n\nDocument content:\n${contentToAnalyze.substring(0, contentLimit)}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 10000,
      });

      const jsonText = aiResponse.choices[0]?.message?.content;
      if (!jsonText) {
        return NextResponse.json(
          { error: "Could not extract text from OpenAI response." },
          { status: 500 }
        );
      }

      const parsed = JSON.parse(jsonText) as { questions: GeneratedQuestion[] };
      questions = parsed.questions;

      // If we're still short, generate missing questions
      if (questions.length < questionCount) {
        const missing = questionCount - questions.length;
        const fillPrompt = userPrompt.replace(
          `Generate EXACTLY ${questionCount} questions`,
          `Generate EXACTLY ${missing} additional questions from the document. Make sure these are DIFFERENT from any previous questions.`
        );

        const fillResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${fillPrompt}\n\nDocument content:\n${contentToAnalyze.substring(0, contentLimit)}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.8, // Slightly higher temperature for variety
          max_tokens: 4000,
        });

        const fillJson = fillResponse.choices[0]?.message?.content;
        if (fillJson) {
          const fillParsed = JSON.parse(fillJson) as { questions: GeneratedQuestion[] };
          // Only take exactly the number we need to avoid exceeding the requested count
          const neededQuestions = fillParsed.questions.slice(0, missing);
          questions.push(...neededQuestions);
        }
      }
    }

    // 5️⃣ Validate results
    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Invalid response format from AI." },
        { status: 500 }
      );
    }

    // Validate we got the requested number of questions
    if (questions.length < questionCount) {
      console.warn(`Requested ${questionCount} questions but only got ${questions.length}. This may be due to content length or model limitations.`);
      // Continue anyway - return what we got rather than fail completely
    }

    // 6️⃣ Done - return questions without saving (user will save manually)
    return NextResponse.json({
      success: true,
      questions,
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
