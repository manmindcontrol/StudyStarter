import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { retryOpenAICall } from "@/lib/openai-retry";

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

// Model used for generation — override with OPENAI_GENERATION_MODEL if needed
const GENERATION_MODEL = process.env.OPENAI_GENERATION_MODEL || "gpt-4.1";

// --- Types -------------------------------------------------------

type QuestionType = "exam" | "test" | "summary";

type AcademicLevel = "standard" | "advanced" | "expert";

type GeneratedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
  // Academic metadata (optional — older saved records don't include them)
  difficulty?: "easy" | "medium" | "hard";
  bloom_level?:
    | "remember"
    | "understand"
    | "apply"
    | "analyze"
    | "evaluate"
    | "create";
  topic?: string;
  rubric?: string[] | null;
};

// --- Helpers -----------------------------------------------------

const getLanguageName = (lang: string) => {
  switch (lang) {
    case "en":
      return "English";
    case "sk":
      return "Slovak (Slovenčina)";
    case "de":
      return "German (Deutsch)";
    default:
      return lang;
  }
};

// Academic level → Bloom's taxonomy distribution and rigor expectations
const LEVEL_INSTRUCTIONS: Record<AcademicLevel, string> = {
  standard: `TARGET LEVEL: Introductory university course (early Bachelor's degree).
Bloom's taxonomy distribution: ~40% remember/understand, ~40% apply/analyze, ~20% evaluate.
Questions should verify solid comprehension of definitions, core mechanisms, and the ability to apply concepts to straightforward cases.`,
  advanced: `TARGET LEVEL: Upper-level university course / final exam (late Bachelor's or Master's degree).
Bloom's taxonomy distribution: ~20% remember/understand, ~50% apply/analyze, ~30% evaluate/create.
Prefer application to novel scenarios, multi-step reasoning, comparison of competing approaches, and interpretation of relationships, data, or formal definitions from the material. Pure recall is acceptable only for genuinely foundational definitions.`,
  expert: `TARGET LEVEL: Graduate seminar / comprehensive (state) examination at a top-tier university.
Bloom's taxonomy distribution: ~10% understand, ~45% apply/analyze, ~45% evaluate/create.
Questions must demand deep mastery: multi-step case analyses, critical evaluation of assumptions and limitations, synthesis across multiple sections of the material, edge cases, and justification of methodological choices. Avoid pure recall entirely.`,
};

// --- MCQ key position ---------------------------------------------
//
// The model copies the key letter from the few-shot example, so asking it to
// vary the position does not work — generated sets come back with nearly every
// key on the same letter. Shuffling the options server-side makes the key
// position uniform by construction.

const letterFor = (index: number) => String.fromCharCode(97 + index);

// Correct option is resolved from the leading letter against the options array,
// never by splitting on " - " (option text may itself contain " - ").
const resolveKeyIndex = (
  answer: string,
  options: string[]
): number | null => {
  const letter = answer.match(/^\s*([a-z])\)/i);
  if (letter) {
    const idx = letter[1].toLowerCase().charCodeAt(0) - 97;
    if (idx >= 0 && idx < options.length) return idx;
  }
  const quoted = options.findIndex(
    (o) => o.trim().length > 0 && answer.includes(o.trim())
  );
  return quoted >= 0 ? quoted : null;
};

const extractRationale = (
  answer: string,
  options: string[],
  keyIndex: number
) => {
  const prefix = `${letterFor(keyIndex)}) ${options[keyIndex].trim()}`;
  const trimmed = answer.trim();
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length).replace(/^\s*-\s*/, "");
  }
  const loose = trimmed.match(/^[a-z]\)\s*.+?\s+-\s+([\s\S]*)$/i);
  return loose ? loose[1].trim() : "";
};

const shuffleMcqOptions = (
  questions: GeneratedQuestion[]
): GeneratedQuestion[] =>
  questions.map((q) => {
    if (
      q.type !== "mcq" ||
      !q.options ||
      q.options.length !== 4 ||
      !q.answer
    ) {
      return q;
    }

    const keyIndex = resolveKeyIndex(q.answer, q.options);
    if (keyIndex === null) return q; // unparseable — leave it untouched

    const rationale = extractRationale(q.answer, q.options, keyIndex);

    // Fisher-Yates over positions: order[newIndex] = oldIndex
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    const options = order.map((oldIndex) => q.options![oldIndex]);
    const newKeyIndex = order.indexOf(keyIndex);

    // The rationale often cites distractors by letter ("(c) confuses…"),
    // so those references have to follow the options to their new positions.
    const letterMap = new Map<string, string>();
    order.forEach((oldIndex, newIndex) =>
      letterMap.set(letterFor(oldIndex), letterFor(newIndex))
    );
    const remappedRationale = rationale.replace(
      /(^|[\s(;,])([a-d])\)/gi,
      (match, lead: string, letter: string) =>
        `${lead}${letterMap.get(letter.toLowerCase()) ?? letter})`
    );

    return {
      ...q,
      options,
      answer: `${letterFor(newKeyIndex)}) ${options[newKeyIndex].trim()} - ${remappedRationale}`,
    };
  });

// The UI renders difficulty/bloom badges via translation lookups, so a value
// outside the enum (a translated one, typically) would render a raw key.
// Dropping it degrades to "no badge", which is harmless.
const DIFFICULTY_VALUES = new Set(["easy", "medium", "hard"]);
const BLOOM_VALUES = new Set([
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
]);

const sanitizeMetadata = (
  questions: GeneratedQuestion[]
): GeneratedQuestion[] =>
  questions.map((q) => {
    const difficulty = q.difficulty?.toLowerCase();
    const bloom = q.bloom_level?.toLowerCase();
    return {
      ...q,
      difficulty: (difficulty && DIFFICULTY_VALUES.has(difficulty)
        ? difficulty
        : undefined) as GeneratedQuestion["difficulty"],
      bloom_level: (bloom && BLOOM_VALUES.has(bloom)
        ? bloom
        : undefined) as GeneratedQuestion["bloom_level"],
    };
  });

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

    const { searchParams } = new URL(request.url);

    const _questionType = (searchParams.get("type") as QuestionType) || "exam";
    const targetLanguage = searchParams.get("lang"); // user can request output lang
    const questionCount = parseInt(searchParams.get("count") || "10", 10); // default 10
    const questionFormat = searchParams.get("format") || "mixed"; // mcq, open, mixed
    const academicLevel = (searchParams.get("difficulty") ||
      "advanced") as AcademicLevel; // standard | advanced | expert

    // Check usage limits BEFORE generation
    const { checkUsageLimit } = await import("@/lib/usage");
    const { allowed, reason, current, limit } = await checkUsageLimit(
      user.id,
      "questions_generations"
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: reason || "Usage limit exceeded",
          current,
          limit,
        },
        { status: 403 }
      );
    }

    // 1️⃣ Load material
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("id, user_id, title, openai_file_id, content")
      .eq("id", materialId)
      .single();

    if (materialError || !material) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    // VERIFY OWNERSHIP
    if (material.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You don't have access to this material" },
        { status: 403 }
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
      formatInstruction = `Generate ONLY multiple-choice questions (MCQ), each with exactly 4 options where exactly one is correct.`;
    } else if (questionFormat === "open") {
      formatInstruction = `Generate ONLY open-ended (constructed-response) questions that require detailed written answers.`;
    } else {
      formatInstruction = `Generate a MIX of both multiple-choice (MCQ) and open-ended questions. Aim for roughly a 50/50 split.`;
    }

    const levelInstruction =
      LEVEL_INSTRUCTIONS[academicLevel] ?? LEVEL_INSTRUCTIONS.advanced;

    // "difficulty" and "bloom_level" are machine-readable enums the UI looks up
    // for its badges — the model will happily translate them along with
    // everything else unless it is told not to, which breaks those lookups.
    const enumCarveOut = `EXCEPTION — do NOT translate these two machine-readable fields. "difficulty" must be exactly one of: easy, medium, hard. "bloom_level" must be exactly one of: remember, understand, apply, analyze, evaluate, create. Always lowercase English, never translated.`;

    const languageInstruction = targetLanguage
      ? `CRITICAL: You MUST generate ALL questions, options, answers, rubrics, and topics in ${getLanguageName(
          targetLanguage
        )}. Do not mix languages. Every single word of that content must be in ${getLanguageName(
          targetLanguage
        )}.
${enumCarveOut}`
      : `Use the dominant language of the document for all questions and answers.
${enumCarveOut}`;

    const systemPrompt = `
You are a senior university professor and psychometric assessment designer at a prestigious research university. You author rigorous, pedagogically sound examination questions that would withstand review by a faculty examination board, following established item-writing standards (Haladyna/NBME guidelines) and Bloom's taxonomy.

${levelInstruction}

CORE PRINCIPLES (non-negotiable):
1. ACADEMIC RIGOR: Questions must probe genuine understanding, not trivia. Ground every question STRICTLY in the provided material — never invent facts, figures, or claims not supported by the source.
2. BLOOM'S TAXONOMY: Deliberately span cognitive levels per the target distribution above, and tag each question with its "bloom_level".
3. CONSTRUCTIVE ALIGNMENT: Each question maps to a genuine learning objective discernible from the material. Record the specific sub-topic it assesses in "topic".
4. FAIRNESS & VALIDITY: Questions must be unambiguous, have a defensibly correct answer, and be free of cultural bias, trick wording, or double negatives.

MCQ CONSTRUCTION STANDARDS:
- Exactly 4 options; exactly one unambiguously correct ("key").
- The three DISTRACTORS must be PLAUSIBLE and instructive — based on common misconceptions, partial understanding, or frequent errors a real student would make. Never use throwaway, obviously-wrong, or joke options.
- The stem must pose a complete, self-contained problem answerable before the options are read.
- Vary the position of the correct answer across questions — do NOT default to the same letter.
- Avoid "all of the above" / "none of the above".

OPTION LENGTH — THIS IS THE MOST COMMONLY VIOLATED RULE, APPLY IT STRICTLY:
- Keep options SHORT. Target 2-8 words each. A single term or short noun phrase is ideal whenever the stem allows it; only use a full clause when the distinction genuinely requires one.
- THE KEY MUST NOT BE THE LONGEST OPTION. Test-wise students pick the longest, most qualified option. Across the whole set, the longest option must land on the key no more often than chance — deliberately make a distractor the longest one in most questions.
- All four options must be within roughly two words of each other. If the key needs a qualifier ("because…", "which leads to…", "resulting in…") to be correct, the qualifier belongs in the STEM or the rationale — never only in the key.
- Move any wording shared by all four options into the stem instead of repeating it in each option.
- Use simple, parallel grammar: same part of speech, same structure, no subordinate clauses in one option and not the others.
- The rationale in "answer" carries the full explanation, so options never need to justify themselves.
- SHORT OPTIONS MUST NOT LOWER COGNITIVE DEMAND. The stem carries the reasoning load; the options are only the endpoints of that reasoning. Do NOT drift towards "which term/enzyme/molecule is X" recall items just because they are easy to keep short — a demanding analyse/evaluate question can and should still have four short options. Honour the Bloom's distribution above; if you notice you are writing mostly recall items, rewrite the stems to demand reasoning while keeping the options terse.

OPEN-ENDED (CONSTRUCTED-RESPONSE) STANDARDS:
- Require reasoning, synthesis, or application — not one-word recall.
- Provide a model answer in "answer" that a top student would give (comprehensive, 4-8 sentences, covering everything needed for full marks).
- Provide a grading "rubric": an array of 3-5 concrete, weighted criteria an examiner would use to score the response, e.g. "Correctly defines X (2 pts)", "Explains the causal mechanism linking X and Y (3 pts)".

${languageInstruction}

OUTPUT — return ONLY valid JSON in EXACTLY this shape:
{
  "questions": [
    {
      "question": "A plant under green light grows more slowly than one under red and blue light. Why is green light less effective at driving photosynthesis?",
      "type": "mcq",
      "options": [
        "It is reflected by chlorophyll",
        "It denatures the chlorophyll pigment",
        "It drives transpiration instead of photosynthesis",
        "It cannot penetrate the thylakoid membrane"
      ],
      "answer": "a) It is reflected by chlorophyll - Chlorophyll a and b absorb mainly red and blue wavelengths and reflect green, so little green light is absorbed to drive photosynthesis. (b) is wrong: green light does not damage the pigment; (c) confuses light quality with water relations; (d) is wrong: membrane penetration is not the limiting factor.",
      "difficulty": "medium",
      "bloom_level": "analyze",
      "topic": "Light absorption in photosynthesis",
      "rubric": null
    },
    {
      "question": "Compare cyclic and non-cyclic photophosphorylation, and explain why a cell might rely more heavily on one under specific conditions.",
      "type": "open",
      "options": null,
      "answer": "Non-cyclic photophosphorylation uses both PSII and PSI, produces ATP and NADPH, and releases O2 by splitting water. Cyclic photophosphorylation uses only PSI, produces ATP but no NADPH, and does not split water. A cell relies more on cyclic flow when it needs additional ATP relative to NADPH — for example when the Calvin cycle consumes ATP faster than NADPH — allowing it to rebalance the ATP:NADPH ratio.",
      "difficulty": "hard",
      "bloom_level": "evaluate",
      "topic": "Photophosphorylation pathways",
      "rubric": [
        "Correctly distinguishes the electron paths / photosystems involved (2 pts)",
        "States the products of each pathway, incl. O2 and NADPH (3 pts)",
        "Explains a valid condition favouring one pathway with reasoning (3 pts)"
      ]
    }
  ]
}

STRICT FORMAT RULES:
- Return ONLY the JSON object, no prose outside it. Root object has a "questions" array.
- MCQ: "options" is an array of EXACTLY 4 strings containing ONLY the option text (NO "a)"/"b)" prefixes inside the array). "rubric" is null for MCQ.
- MCQ "answer": MUST be "<lowercase letter>) <full text of the correct option> - <rationale>". NEVER just a letter; ALWAYS include the full option text between the letter and the dash. Use lowercase letters (a, b, c, d), NOT uppercase.
- Open: "type"="open", "options"=null, "answer"=model answer, "rubric"=array of criteria.
- Every question MUST include "difficulty", "bloom_level", and "topic".
`;

    const userPrompt = `
Material title: "${material.title}"

Task:
Generate EXACTLY ${questionCount} examination-grade questions from the educational material below, suitable for use in a real university assessment.

Question format requirements:
${formatInstruction}

Requirements:
- Cover the BREADTH of the material — draw from different sections/chapters, not just the opening pages. Avoid clustering on a single topic.
- Ensure no two questions are near-duplicates or test the exact same fact.
- Follow the Bloom's taxonomy distribution and rigor standards for the target academic level.
- Set "difficulty" honestly (easy/medium/hard); the overall set should span a range appropriate to the level.
- Base everything STRICTLY on the provided material; do not introduce outside facts.
- Write in an academic register appropriate for university students.
- Return ONLY the JSON described in the system message.
`;

    // 3️⃣ Use extracted content directly
    const contentToAnalyze = material.content || "No content available";

    // Adjust content limit based on question count - larger for longer documents
    const contentLimit =
      questionCount > 20 ? 150000 : questionCount > 10 ? 100000 : 80000;

    // Shared completion runner for consistency
    const runCompletion = (userContent: string, temperature = 0.6) =>
      retryOpenAICall(() =>
        openai.chat.completions.create({
          model: GENERATION_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
          temperature,
          max_tokens: 12000,
        })
      );

    // 4️⃣ Generate questions (split into batches if count > 15 to avoid token limits)
    let questions: GeneratedQuestion[] = [];

    if (questionCount > 15) {
      // Split into two batches covering different document sections
      const firstBatch = Math.ceil(questionCount / 2);
      const secondBatch = questionCount - firstBatch;

      const halfPoint = Math.floor(contentToAnalyze.length / 2);
      const firstHalfContent = contentToAnalyze.substring(0, halfPoint);
      const secondHalfContent = contentToAnalyze.substring(halfPoint, contentLimit);

      const firstPrompt = userPrompt.replace(
        `Generate EXACTLY ${questionCount} examination-grade questions`,
        `Generate EXACTLY ${firstBatch} examination-grade questions from this (first) section of the document`
      );
      const secondPrompt = userPrompt.replace(
        `Generate EXACTLY ${questionCount} examination-grade questions`,
        `Generate EXACTLY ${secondBatch} examination-grade questions from this (second) section of the document. Make sure they are DIFFERENT from any earlier questions`
      );

      const [firstResponse, secondResponse] = await Promise.all([
        runCompletion(`${firstPrompt}\n\nDocument content:\n${firstHalfContent}`),
        runCompletion(`${secondPrompt}\n\nDocument content:\n${secondHalfContent}`),
      ]);

      const firstJson = firstResponse.choices[0]?.message?.content;
      if (firstJson) {
        const firstParsed = JSON.parse(firstJson) as {
          questions: GeneratedQuestion[];
        };
        questions.push(...firstParsed.questions);
      }

      const secondJson = secondResponse.choices[0]?.message?.content;
      if (secondJson) {
        const secondParsed = JSON.parse(secondJson) as {
          questions: GeneratedQuestion[];
        };
        questions.push(...secondParsed.questions);
      }
    } else {
      // Single batch for 15 or fewer questions
      const aiResponse = await runCompletion(
        `${userPrompt}\n\nDocument content:\n${contentToAnalyze.substring(0, contentLimit)}`
      );

      const jsonText = aiResponse.choices[0]?.message?.content;
      if (!jsonText) {
        return NextResponse.json(
          { error: "Could not extract text from OpenAI response." },
          { status: 500 }
        );
      }

      const parsed = JSON.parse(jsonText) as { questions: GeneratedQuestion[] };
      questions = parsed.questions;
    }

    // If we're still short, generate the missing questions
    if (Array.isArray(questions) && questions.length < questionCount) {
      const missing = questionCount - questions.length;
      const fillPrompt = userPrompt.replace(
        `Generate EXACTLY ${questionCount} examination-grade questions`,
        `Generate EXACTLY ${missing} additional examination-grade questions from the document. Make sure they are DIFFERENT from any earlier questions`
      );

      const fillResponse = await runCompletion(
        `${fillPrompt}\n\nDocument content:\n${contentToAnalyze.substring(0, contentLimit)}`,
        0.8 // slightly higher temperature for variety
      );

      const fillJson = fillResponse.choices[0]?.message?.content;
      if (fillJson) {
        const fillParsed = JSON.parse(fillJson) as {
          questions: GeneratedQuestion[];
        };
        questions.push(...fillParsed.questions.slice(0, missing));
      }
    }

    // 5️⃣ Validate results
    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Invalid response format from AI." },
        { status: 500 }
      );
    }

    // Trim to the requested count in case a batch over-produced
    if (questions.length > questionCount) {
      questions = questions.slice(0, questionCount);
    }

    if (questions.length < questionCount) {
      console.warn(
        `Requested ${questionCount} questions but only got ${questions.length}. This may be due to content length or model limitations.`
      );
      // Continue anyway - return what we got rather than fail completely
    }

    // 6️⃣ Randomise MCQ key position and drop invalid metadata, then return
    questions = sanitizeMetadata(shuffleMcqOptions(questions));

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
