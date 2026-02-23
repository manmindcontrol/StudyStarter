import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceRoleClient } from "@/lib/utils";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createServiceRoleClient();

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
    const { question, userAnswer, correctAnswer } = body as {
      question: string;
      userAnswer: string;
      correctAnswer: string;
    };

    if (!question || !userAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use OpenAI to validate the answer
    const systemPrompt = `You are an AI assistant that validates student answers to open-ended questions.

Your task:
1. Compare the student's answer with the correct answer
2. Determine if the student's answer is correct, partially correct, or incorrect
3. Consider that answers can be phrased differently but still be correct
4. Be lenient with minor wording differences if the core concept is correct
5. Provide brief, constructive feedback

Respond in JSON format:
{
  "isCorrect": true/false,
  "feedback": "Brief explanation (1-2 sentences)"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Question: ${question}

Correct Answer: ${correctAnswer}

Student's Answer: ${userAnswer}

Please evaluate if the student's answer is correct.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    const validation = JSON.parse(result);

    return NextResponse.json({
      isCorrect: validation.isCorrect,
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
