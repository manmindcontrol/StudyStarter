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

    // Get user from session - CRITICAL FOR SECURITY
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Check usage limits BEFORE generation
    const { checkUsageLimit } = await import("@/lib/usage");
    const { allowed, reason, current, limit } = await checkUsageLimit(user.id, 'notes_generations');

    if (!allowed) {
      return NextResponse.json(
        {
          error: reason || 'Usage limit exceeded',
          current,
          limit,
        },
        { status: 403 }
      );
    }

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

    // VERIFY OWNERSHIP
    if (material.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You don't have access to this material" },
        { status: 403 }
      );
    }

    if (!material.content) {
      return NextResponse.json(
        { error: "This material does not have content to analyze." },
        { status: 400 }
      );
    }

    // 2️⃣ Build prompts
    const getLanguageName = (lang: string) => {
      switch (lang) {
        case 'en': return 'English';
        case 'sk': return 'Slovak (Slovenčina)';
        case 'de': return 'German (Deutsch)';
        default: return lang;
      }
    };

    const languageInstruction = targetLanguage
      ? `CRITICAL: You MUST write ALL notes, summaries, key points, concepts, examples, and study tips in ${getLanguageName(targetLanguage)}. Do not mix languages. Every single word in the output must be in ${getLanguageName(targetLanguage)}.`
      : `Use the dominant language of the document for all notes and explanations.`;

    const systemPrompt = `
You are an expert academic tutor who creates COMPREHENSIVE, STRUCTURED study notes from educational materials.

CRITICAL: DO NOT create an abstract or short general summary. Create FULL-FLEDGED STUDY NOTES that a student can learn from even without the original text.

Your task:
1. First, thoroughly read and understand the main ideas, concepts, definitions, examples, and connections in the text
2. Identify the document's structure (chapters, sections, subsections) and use it to organize notes logically
3. Progress from GENERAL concepts to SPECIFIC details, following the document's natural flow
4. Create STUDY NOTES with this structure:

Your output must ALWAYS be valid JSON in this exact format:

{
  "summary": "TOPIC OVERVIEW (2-4 sentences explaining the goal/purpose of this chapter/material)",
  "key_points": [
    {
      "title": "Key Term or Concept Name",
      "description": "DETAILED explanation in your own words - NOT one sentence without context. Explain what it means, why it matters, how it works. Build understanding from basics to more complex aspects. Include reasoning, applications, and practical significance. Write 6-10 sentences minimum that flow naturally and build upon each other.\n\nIMPORTANT: If this key point has subsections or divisions (e.g., types, categories, phases, components), include them as bullet points within the description:\n• Subsection/Division 1: For IMPORTANT divisions that the document emphasizes, provide 3-4 sentences explaining what this is, why it matters, how it works, and its significance. For LESS IMPORTANT divisions mentioned briefly, provide 1-2 sentences.\n• Subsection/Division 2: For IMPORTANT divisions that the document emphasizes, provide 3-4 sentences explaining what this is, why it matters, how it works, and its significance. For LESS IMPORTANT divisions mentioned briefly, provide 1-2 sentences.\n\nMake bullet points flow naturally within the overall explanation, progressing from general overview to specific divisions. MATCH THE LEVEL OF DETAIL to how much attention the document gives to each division.",
      "importance": "high" | "medium" | "low"
    }
  ],
  "concepts": [
    {
      "concept": "Main Idea / Theory / Process Name",
      "explanation": "COMPREHENSIVE explanation organized logically from GENERAL to SPECIFIC, following this progression:\n\n1. START GENERAL: What this concept is and its theoretical foundation (big picture)\n2. MOVE TO STRUCTURE: If this concept has divisions, categories, or phases, list them:\n   • Division/Category 1: For IMPORTANT divisions that the document emphasizes or spends significant time explaining, provide 3-4 sentences covering: what it is, its role, how it works, and why it matters. For LESS IMPORTANT divisions mentioned only briefly in the document, provide 1-2 sentences with a concise description.\n   • Division/Category 2: For IMPORTANT divisions that the document emphasizes or spends significant time explaining, provide 3-4 sentences covering: what it is, its role, how it works, and why it matters. For LESS IMPORTANT divisions mentioned only briefly in the document, provide 1-2 sentences with a concise description.\n   • Division/Category 3: For IMPORTANT divisions that the document emphasizes or spends significant time explaining, provide 3-4 sentences covering: what it is, its role, how it works, and why it matters. For LESS IMPORTANT divisions mentioned only briefly in the document, provide 1-2 sentences with a concise description.\n3. GET SPECIFIC: How it works (step-by-step if it's a process)\n4. EXPLAIN SIGNIFICANCE: Why it's important and where it's used\n5. CONNECT: How it connects to other concepts\n6. CLARIFY: Common misunderstandings or typical mistakes\n7. COMPARE: Important relationships and comparisons\n\nWrite 10-18 sentences minimum as a flowing, educational narrative that progresses naturally from general overview through structural divisions to specific details. Make bullet points integrate smoothly into the explanation. CRITICAL: Match the level of detail in each bullet point to the emphasis the document places on that division - important concepts deserve 3-4 sentences, minor mentions deserve 1-2 sentences.",
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
✓ Summary: 2-5 sentences explaining the topic's purpose
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
- Build understanding progressively from GENERAL to SPECIFIC (big picture → structure/divisions → detailed mechanisms)
- When a concept has divisions/categories/types, list them with bullet points and 1-2 sentence descriptions
- Make bullet points flow organically within the narrative - they should enhance, not interrupt the explanation
- Follow the document's natural progression and structure (chapters, sections, subsections)
`;

    const userPrompt = `
Material title: "${material.title}"

Task:
Create DETAILED, STRUCTURED study notes from this educational material. Depending of the size and complexity of the document, the notes should always be COMPREHENSIVE enough to fully cover the material and enable effective studying without needing to refer back to the original text. Also based on the document's content and structure, adapt the depth and breadth of the notes to ensure they are complete and thorough. If the document is longer also the notes must be longer and vice versa.

I DO NOT WANT an abstract or short general summary. I want FULL STUDY NOTES that a student can learn from even without access to the original text.

Your notes must:
1. Thoroughly read and understand the main ideas, concepts, definitions, examples, and connections
2. Identify and respect the document's structure (chapters, sections, subsections)
3. Organize content from GENERAL (overview, purpose) to SPECIFIC (detailed mechanisms, examples)
4. Follow the exact structure specified: Overview → Key Terms → Main Concepts → Study Guide
5. When a concept has divisions/categories/types, include them as bullet points with VARIABLE LENGTH descriptions:
   - For IMPORTANT divisions that the document emphasizes or explains in detail: write 3-4 sentences
   - For LESS IMPORTANT divisions mentioned only briefly: write 1-2 sentences
   - Match the detail level to the document's emphasis on each division
6. Explain every important concept in detail (10-18 sentences per concept for main concepts, 6-10 for key points)
7. Include all processes/procedures step-by-step
8. Incorporate and explain all examples from the text
9. Highlight important connections, comparisons, and relationships
10. Identify common mistakes or misunderstandings
11. Provide a complete study guide with review questions
12. Write in clear, educational style suitable for first-time learners
13. Use the text's information exclusively - don't add external facts
14. Make bullet points flow naturally within explanations - they should feel organic, not forced
15. CRITICAL: Gauge the importance of each division/subconcept based on how much the document discusses it

DO NOT:
- Create a short abstract
- Write one-sentence definitions without context
- Skip important parts of the material
- Assume prior knowledge
- Reduce explanations to superficial summaries

DO:
- Build understanding from GENERAL to SPECIFIC (overview → structure/divisions → details)
- When you encounter divisions/categories/types, present them as bullet points with descriptions that MATCH THE DOCUMENT'S EMPHASIS:
  * Important divisions the document explains thoroughly = 3-4 sentences
  * Minor divisions mentioned briefly = 1-2 sentences
- Progress logically: introduce the concept broadly, then break it down into parts, then explain details
- Explain the "why" and "how", not just "what"
- Provide complete, flowing educational narratives where bullet points enhance rather than interrupt the flow
- Make notes comprehensive enough to replace the original text for studying
- Include all relevant details, examples, and procedures from the source material
- Follow the document's natural organization and progression
- Analyze how much attention the document gives to each subconcept and reflect that in your explanation length
`;

    // 3️⃣ Stream OpenAI response directly to the client
    const contentToAnalyze = material.content.substring(0, 100000);

    const openaiStream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrompt}\n\nDocument content:\n${contentToAnalyze}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 16000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of openaiStream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
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
