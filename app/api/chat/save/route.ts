import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/utils";

export const runtime = "nodejs";

const supabase = createServiceRoleClient();

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    // Get user from session
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

    const body = await request.json();
    const {
      conversationId,
      messages,
      chatType,
      materialId,
      noteId,
      questionId,
    } = body;

    if (!conversationId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Missing required fields: conversationId, messages" },
        { status: 400 }
      );
    }

    // Validate chat type
    const validChatTypes = ["general", "material", "notes", "questions"];
    if (chatType && !validChatTypes.includes(chatType)) {
      return NextResponse.json(
        { error: `Invalid chat type. Must be one of: ${validChatTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Prepare messages for insertion
    const messagesToInsert = messages.map((msg: ChatMessage) => ({
      user_id: user.id,
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      chat_type: chatType || "general",
      material_id: materialId || null,
      note_id: noteId || null,
      question_id: questionId || null,
    }));

    // Insert messages to database
    const { data: inserted, error: insertError } = await supabase
      .from("chat_history")
      .insert(messagesToInsert)
      .select();

    if (insertError) {
      console.error("[Chat Save] Database error:", insertError);

      // If table doesn't exist yet (migration not applied), fail gracefully
      if (insertError.code === '42P01' || insertError.message?.includes('relation "chat_history" does not exist')) {
        console.warn("[Chat Save] chat_history table does not exist. Please run migration 003. Messages not saved.");
        // Return success to not break UI, but log warning
        return NextResponse.json({
          success: true,
          count: 0,
          messages: [],
          warning: "Chat history not saved - database migration pending",
        });
      }

      return NextResponse.json(
        { error: `Failed to save messages: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log(`[Chat Save] Saved ${inserted?.length || 0} messages for user ${user.id}`);

    return NextResponse.json({
      success: true,
      count: inserted.length,
      messages: inserted,
    });
  } catch (error) {
    console.error("[Chat Save] Unexpected error:", error);
    const msg = error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
