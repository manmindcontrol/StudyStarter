import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/utils";

export const runtime = "nodejs";

const supabase = createServiceRoleClient();

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const chatType = searchParams.get("chatType");
    const materialId = searchParams.get("materialId");
    const noteId = searchParams.get("noteId");
    const questionId = searchParams.get("questionId");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Build query
    let query = supabase
      .from("chat_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(limit);

    // Apply filters
    if (conversationId) {
      query = query.eq("conversation_id", conversationId);
    }

    if (chatType) {
      query = query.eq("chat_type", chatType);
    }

    if (materialId) {
      query = query.eq("material_id", materialId);
    }

    if (noteId) {
      query = query.eq("note_id", noteId);
    }

    if (questionId) {
      query = query.eq("question_id", questionId);
    }

    const { data: messages, error: queryError } = await query;

    if (queryError) {
      console.error("[Chat History] Database error:", queryError);

      // If table doesn't exist yet (migration not applied), return empty array
      if (queryError.code === '42P01' || queryError.message?.includes('relation "chat_history" does not exist')) {
        console.warn("[Chat History] chat_history table does not exist. Please run migration 003.");
        return NextResponse.json({
          success: true,
          count: 0,
          messages: [],
        });
      }

      return NextResponse.json(
        { error: `Failed to retrieve chat history: ${queryError.message}` },
        { status: 500 }
      );
    }

    console.log(`[Chat History] Retrieved ${messages?.length || 0} messages for user ${user.id}`);

    // Transform to frontend format
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.created_at,
    }));

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("[Chat History] Unexpected error:", error);
    const msg = error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
