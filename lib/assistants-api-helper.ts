import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Helper function to run Assistants API with file search
 * Works with vector stores for large document support
 */
export async function runAssistantWithFileSearch({
  vectorStoreId,
  systemInstructions,
  userMessage,
  model = "gpt-4o-mini",
  temperature = 0.7,
  responseFormat,
}: {
  vectorStoreId: string;
  systemInstructions: string;
  userMessage: string;
  model?: string;
  temperature?: number;
  responseFormat?: { type: "json_object" | "text" };
}): Promise<string> {
  // 1. Create assistant with file search tool
  const assistant = await openai.beta.assistants.create({
    name: "Study Material Assistant",
    instructions: systemInstructions,
    model,
    tools: [{ type: "file_search" }],
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStoreId],
      },
    },
    temperature,
    response_format: responseFormat as { type: "json_object" | "text" } | undefined,
  });

  try {
    // 2. Create thread with user message
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // 3. Run the assistant
    let run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    // 4. Poll for completion
    while (run.status === "queued" || run.status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(run.id, {
        thread_id: thread.id
      });
    }

    // 5. Check for errors
    if (run.status === "failed") {
      throw new Error(`Assistant run failed: ${run.last_error?.message || "Unknown error"}`);
    }

    if (run.status !== "completed") {
      throw new Error(`Assistant run ended with status: ${run.status}`);
    }

    // 6. Get messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find((msg) => msg.role === "assistant");

    if (!assistantMessage) {
      throw new Error("No assistant response found");
    }

    // Extract text from message
    const textContent = assistantMessage.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in assistant response");
    }

    return textContent.text.value;
  } finally {
    // Cleanup: Delete the assistant
    await openai.beta.assistants.delete(assistant.id);
  }
}

/**
 * Helper for streaming responses (useful for chat)
 */
export async function runAssistantWithFileSearchStreaming({
  vectorStoreId,
  systemInstructions,
  userMessage,
  previousMessages = [],
  model = "gpt-4o-mini",
  temperature = 0.7,
}: {
  vectorStoreId: string;
  systemInstructions: string;
  userMessage: string;
  previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string;
  temperature?: number;
}) {
  // 1. Create assistant
  const assistant = await openai.beta.assistants.create({
    name: "Study Material Assistant",
    instructions: systemInstructions,
    model,
    tools: [{ type: "file_search" }],
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStoreId],
      },
    },
    temperature,
  });

  // 2. Create thread with message history
  const thread = await openai.beta.threads.create({
    messages: [
      ...previousMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userMessage,
      },
    ],
  });

  // 3. Create streaming run
  const stream = openai.beta.threads.runs.stream(thread.id, {
    assistant_id: assistant.id,
  });

  return {
    stream,
    cleanup: async () => {
      await openai.beta.assistants.delete(assistant.id);
    },
  };
}
