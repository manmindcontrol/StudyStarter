import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";

// Environment keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

// Supabase service client (server only)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// OpenAI
const openai = new OpenAI({ apiKey: openaiApiKey });

// --- Types -------------------------------------------------------

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

type StudyNotesResponse = {
  summary: string;
  key_points: KeyPoint[];
  concepts: Concept[];
  study_tips: string;
};

// --- API Route ---------------------------------------------------

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await context.params;
    const { searchParams } = new URL(request.url);
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

    if (!material.content) {
      return NextResponse.json(
        { error: "This material does not have content to analyze." },
        { status: 400 }
      );
    }

    // 2️⃣ Build prompts
    const languageInstruction = targetLanguage
      ? `Use ${targetLanguage} for all notes, summaries, and explanations.`
      : `Use the dominant language of the document for all notes and explanations.`;

    const systemPrompt = `
You are an expert academic tutor who creates COMPREHENSIVE, STRUCTURED study notes from educational materials.

CRITICAL: DO NOT create an abstract or short general summary. Create FULL-FLEDGED STUDY NOTES that a student can learn from even without the original text.

Your task:
1. First, thoroughly read and understand the main ideas, concepts, definitions, examples, and connections in the text
2. Create STUDY NOTES with this structure:

Your output must ALWAYS be valid JSON in this exact format:

{
  "summary": "TOPIC OVERVIEW (2-4 sentences explaining the goal/purpose of this chapter/material)",
  "key_points": [
    {
      "title": "Key Term or Concept Name",
      "description": "DETAILED explanation in your own words - NOT one sentence without context. Explain what it means, why it matters, how it works. Build understanding from basics to more complex aspects. Include reasoning, applications, and practical significance. Write 6-10 sentences minimum that flow naturally and build upon each other.",
      "importance": "high" | "medium" | "low"
    }
  ],
  "concepts": [
    {
      "concept": "Main Idea / Theory / Process Name",
      "explanation": "COMPREHENSIVE explanation organized logically from foundations to advanced topics. Include:\n- What this concept is and its theoretical foundation\n- How it works (step-by-step if it's a process)\n- Why it's important and where it's used\n- How it connects to other concepts\n- Common misunderstandings or typical mistakes\n- Important relationships and comparisons\nWrite 8-15 sentences minimum as a flowing, educational narrative.",
      "examples": [
        "Detailed example 1: Explain what it demonstrates, provide full context, walk through the reasoning",
        "Detailed example 2: Show a different application or variation, explain the nuances",
        "Detailed example 3: Illustrate a common mistake or edge case, explain why it matters"
      ]
    }
  ],
  "study_tips": "COMPREHENSIVE STUDY GUIDE containing:\n\nPARAGRAPH 1: How to approach this material (what to focus on first, how to build understanding)\n\nPARAGRAPH 2: What to prioritize (most important concepts, critical connections to remember)\n\nPARAGRAPH 3: How to practice and apply (active learning strategies, self-testing methods)\n\nPARAGRAPH 4: Common mistakes to avoid (typical misunderstandings, pitfalls to watch for)\n\nPARAGRAPH 5: Exam preparation strategies (types of questions to expect, how to demonstrate understanding)\n\nPARAGRAPH 6: Final summary of key takeaways (main points in a few sentences)\n\nPARAGRAPH 7: 5-10 REVIEW QUESTIONS that students should be able to answer after studying these notes\n\nEach paragraph should be 4-6 sentences. Make it specific and actionable."
}

${languageInstruction}

MANDATORY REQUIREMENTS:
✓ Summary: 2-4 sentences explaining the topic's purpose
✓ Key Points: 7-12 important terms/definitions, each with 6-10 sentences of explanation
✓ Concepts: 4-8 main ideas/theories/processes, each with 8-15 sentences PLUS 3-5 detailed examples
✓ Study Tips: 7 structured paragraphs (approach, priorities, practice, mistakes, exam prep, summary, review questions)

WRITING STYLE:
- Write clearly and understandably, as if for a student learning this for the first time
- Explain terms; don't assume the reader knows everything
- Use headings, subheadings, and structure for clarity
- Don't skip substantial parts of the text
- If there's a definition, explain and expand on it
- If there's a relationship, formula, or diagram, describe what it means and how to use it
- Don't reduce to "a few paragraphs about what it's about"
- Stick EXCLUSIVELY to information from the provided text - DO NOT invent new facts
- Explain WHY things matter, not just WHAT they are
- Build understanding progressively from simple to complex
`;

    const userPrompt = `
Material title: "${material.title}"

Task:
Create DETAILED, STRUCTURED study notes from this educational material.

I DO NOT WANT an abstract or short general summary. I want FULL STUDY NOTES that a student can learn from even without access to the original text.

Your notes must:
1. Thoroughly read and understand the main ideas, concepts, definitions, examples, and connections
2. Follow the exact structure specified: Overview → Key Terms → Main Concepts → Study Guide
3. Explain every important concept in detail (6-15 sentences per concept)
4. Include all processes/procedures step-by-step
5. Incorporate and explain all examples from the text
6. Highlight important connections, comparisons, and relationships
7. Identify common mistakes or misunderstandings
8. Provide a complete study guide with review questions
9. Write in clear, educational style suitable for first-time learners
10. Use the text's information exclusively - don't add external facts

DO NOT:
- Create a short abstract
- Write one-sentence definitions without context
- Skip important parts of the material
- Assume prior knowledge
- Reduce explanations to superficial summaries

DO:
- Build understanding from basics to advanced
- Explain the "why" and "how", not just "what"
- Provide complete, flowing educational narratives
- Make notes comprehensive enough to replace the original text for studying
- Include all relevant details, examples, and procedures from the source material
`;

    // 3️⃣ Call OpenAI
    const contentToAnalyze = material.content.substring(0, 30000); // Increased limit for more comprehensive analysis

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o", // Using more powerful model for better comprehensive notes
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `${userPrompt}\n\nDocument content:\n${contentToAnalyze}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // Slightly higher for more natural, flowing text
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
    let notesData: StudyNotesResponse;

    try {
      notesData = JSON.parse(jsonText) as StudyNotesResponse;

      if (!notesData.summary || !Array.isArray(notesData.key_points) || !Array.isArray(notesData.concepts)) {
        throw new Error("Invalid notes structure");
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
      .from("study_notes")
      .insert({
        material_id: material.id,
        user_id: material.user_id,
        summary: notesData.summary,
        key_points: notesData.key_points,
        concepts: notesData.concepts,
        study_tips: notesData.study_tips,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save study notes." },
        { status: 500 }
      );
    }

    // 7️⃣ Done
    return NextResponse.json({
      success: true,
      notes: notesData,
      record: inserted,
    });
  } catch (error) {
    console.error("Generate Notes Error:", error);
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
