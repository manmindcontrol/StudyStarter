import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceRoleClient } from "@/lib/utils";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createServiceRoleClient();

// Model used for grading — override with OPENAI_GENERATION_MODEL if needed
const GRADING_MODEL = process.env.OPENAI_GENERATION_MODEL || "gpt-4.1";

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

    const body = await request.json();
    const { question, userAnswer, correctAnswer, rubric } = body as {
      question: string;
      userAnswer: string;
      correctAnswer: string;
      rubric?: string[] | null;
    };

    if (!question || !userAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const rubricBlock =
      rubric && rubric.length > 0
        ? `\n\nGrading rubric (award credit per criterion):\n${rubric
            .map((c, i) => `${i + 1}. ${c}`)
            .join("\n")}`
        : "";

    // Use OpenAI to grade the answer like a university examiner
    const systemPrompt = `You are an experienced university examiner grading a student's open-ended (constructed-response) answer. Grade fairly, rigorously, and constructively, exactly as you would on a real university exam.

Grading principles:
1. Judge the SUBSTANCE of the answer against the model answer (and rubric, if provided), not superficial wording. Different phrasing, synonyms, or ordering that convey the correct ideas earn full credit.
2. Award PARTIAL CREDIT: an answer can be fully correct, partially correct, or incorrect. Reward what the student got right and identify what is missing or wrong.
3. Do not reward vague, empty, or irrelevant answers, nor penalize an academically sound answer that differs from the model answer but is still correct.
4. Be accurate about factual/conceptual errors — a prestigious university expects precision.
5. Feedback must be specific and constructive: name the concepts the student captured, and the key points they missed or got wrong. 1-3 sentences. Address the student directly and in the SAME LANGUAGE as their answer.

Respond in JSON:
{
  "isCorrect": true | false,   // true only if the answer would earn a clear passing/near-full score
  "score": 0-100,               // percentage of the marks you would award
  "verdict": "correct" | "partial" | "incorrect",
  "feedback": "Specific, constructive feedback in the student's language."
}`;

    const completion = await openai.chat.completions.create({
      model: GRADING_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Question: ${question}

Model / correct answer: ${correctAnswer}${rubricBlock}

Student's answer: ${userAnswer}

Grade the student's answer.`,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    const validation = JSON.parse(result);

    // Normalise score to a 0-100 integer when present
    let score: number | null =
      typeof validation.score === "number" ? Math.round(validation.score) : null;
    if (score !== null) score = Math.max(0, Math.min(100, score));

    return NextResponse.json({
      isCorrect: validation.isCorrect,
      verdict: validation.verdict ?? null,
      score,
      feedback: validation.feedback,
    });
  } catch (error) {
    console.error("Error validating answer:", error);
    return NextResponse.json(
      {
        error: "Failed to validate answer",
        isCorrect: null,
        feedback: "Could not validate your answer. Please check the correct answer below.",
      },
      { status: 500 }
    );
  }
}
