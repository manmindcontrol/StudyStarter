// Shared content model for exporting a generated test to Word.
//
// The "student" variant must never emit an answer block, and that rule lives
// in exactly one place.

export type ExportVariant = "teacher" | "student";

export type ExportedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
};

export type ExportBlock =
  | { kind: "title"; text: string }
  | { kind: "nameLine"; text: string }
  | { kind: "question"; number: number; text: string }
  | { kind: "option"; letter: string; text: string }
  | { kind: "writingSpace" }
  | { kind: "answer"; label: string; text: string }
  | { kind: "spacer" };

export type ExportLabels = {
  correctAnswer: string;
  name: string;
  date: string;
};

/** Blank lines of room given to an open question on the student copy. */
export const WRITING_SPACE_LINES = 6;

export function buildExportBlocks(
  questions: ExportedQuestion[],
  options: { variant: ExportVariant; title: string; labels: ExportLabels },
): ExportBlock[] {
  const { variant, title, labels } = options;
  const forStudent = variant === "student";
  const blocks: ExportBlock[] = [{ kind: "title", text: title }];

  if (forStudent) {
    blocks.push({
      kind: "nameLine",
      text: `${labels.name} ______________________________     ${labels.date} ________________`,
    });
  }

  questions.forEach((q, index) => {
    blocks.push({ kind: "question", number: index + 1, text: q.question });

    if (q.type === "mcq" && q.options) {
      q.options.forEach((option, optionIndex) => {
        blocks.push({
          kind: "option",
          letter: String.fromCharCode(97 + optionIndex),
          text: option,
        });
      });
      blocks.push({ kind: "spacer" });
    }

    // Open questions get empty room to write in — no ruled lines
    if (q.type === "open" && forStudent) {
      for (let i = 0; i < WRITING_SPACE_LINES; i++) {
        blocks.push({ kind: "writingSpace" });
      }
    }

    // The single gate that keeps answers off the student copy
    if (!forStudent && q.answer) {
      blocks.push({
        kind: "answer",
        label: labels.correctAnswer,
        text: q.answer,
      });
    }

    blocks.push({ kind: "spacer" });
  });

  return blocks;
}
