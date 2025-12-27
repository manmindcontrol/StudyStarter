# OpenAI Assistants API Migration Guide

## Overview

This document describes the migration from OpenAI Chat Completions API to Assistants API with File Search, enabling support for much larger documents (500+ pages, up to 512MB per file).

## What Changed

### Before Migration
- **Document Size Limit**: ~200 pages (~128K tokens)
- **API**: Chat Completions API
- **Document Handling**: Full document content passed in prompt
- **Use Case**: Good for medium-sized documents

### After Migration
- **Document Size Limit**: Thousands of pages (512MB per file)
- **API**: Assistants API with Vector Stores
- **Document Handling**: Automatic chunking and semantic search
- **Use Case**: Excellent for large documents, research papers, textbooks

## Technical Architecture

### Hybrid Approach

We use a **hybrid architecture** to optimize performance:

| Feature | API Used | Reason |
|---------|----------|--------|
| **Chat with Documents** | Assistants API | Conversational file search, supports large documents |
| **Question Generation** | Chat Completions | Better for structured JSON output, uses batching |
| **Notes Generation** | Chat Completions | Better for structured JSON output |
| **Notes Chat** | Chat Completions | Uses current notes, not document search |

### Database Schema Changes

New columns added to `materials` table:

```sql
- vector_store_id: TEXT (ID of OpenAI Vector Store)
- assistant_id: TEXT (Reserved for future use)
- file_search_enabled: BOOLEAN (Whether file search is enabled)
```

### File Upload Flow

```
1. Upload file to OpenAI Files API (purpose: "assistants")
   ↓
2. Create Vector Store with the file
   ↓
3. Upload to Supabase Storage
   ↓
4. Save to database with vector_store_id
```

### Chat Flow

```
1. Load material to get vector_store_id
   ↓
2. Create temporary Assistant with file_search tool
   ↓
3. Create thread with user message + conversation history
   ↓
4. Run assistant and poll for completion
   ↓
5. Return response
   ↓
6. Cleanup: Delete temporary assistant
```

## Files Modified

### Created
- `supabase/migrations/add_assistants_api_fields.sql` - Database migration
- `lib/assistants-api-helper.ts` - Reusable helper functions
- `scripts/migrate-existing-materials.ts` - Migration script
- `app/api/materials/[id]/chat/route-old.ts` - Backup of old implementation

### Modified
- `app/api/upload/route.ts` - Now creates vector stores
- `app/api/materials/[id]/chat/route.ts` - Uses Assistants API

### Unchanged
- `app/api/materials/[id]/generate-questions/route.ts`
- `app/api/materials/[id]/generate-notes/route.ts`
- `app/api/materials/[id]/notes/chat/route.ts`

## Migration Instructions

### 1. Apply Database Migration

```bash
# Run the SQL migration in Supabase dashboard or via CLI
supabase db push
```

Or manually run:
```sql
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS vector_store_id TEXT,
ADD COLUMN IF NOT EXISTS assistant_id TEXT,
ADD COLUMN IF NOT EXISTS file_search_enabled BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_materials_vector_store_id ON materials(vector_store_id);
CREATE INDEX IF NOT EXISTS idx_materials_assistant_id ON materials(assistant_id);
```

### 2. Migrate Existing Materials

Run the migration script to add vector stores to existing materials:

```bash
npx tsx scripts/migrate-existing-materials.ts
```

This script will:
- Find all materials with `openai_file_id` but no `vector_store_id`
- Create a vector store for each file
- Update the database with the new `vector_store_id`
- Show progress and summary

**Output Example:**
```
🔄 Starting migration of existing materials to Assistants API...

📊 Found 5 materials to migrate

📄 Migrating: Introduction to AI (ID: abc123)
   OpenAI File ID: file-xyz789
   ✅ Created vector store: vs_def456
   ✅ Database updated successfully

📊 Migration Summary:
   ✅ Successfully migrated: 5
   ❌ Failed: 0
   📈 Total processed: 5

🎉 Migration completed! Your existing materials now support:
   - Large document processing (500+ pages)
   - Automatic vector search
   - Enhanced AI responses with file_search
```

### 3. Deploy Updated Code

Deploy the updated code to your production environment:

```bash
# If using Vercel
vercel --prod

# Or your deployment method
npm run build
```

## New Capabilities

### Large Document Support
- **Before**: ~200 pages maximum
- **After**: 500+ pages, up to 512MB per file

### Automatic Chunking
Vector stores automatically split documents into optimal chunks for retrieval.

### Semantic Search
File search uses embeddings to find relevant sections, not just keyword matching.

### Better Context
Assistant retrieves only relevant sections, making responses more focused.

## API Behavior

### Chat Endpoint (`/api/materials/[id]/chat`)

**Request:** Same as before
```json
{
  "message": "Explain the main concept",
  "messages": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

**Response:** Same format
```json
{
  "message": "AI response based on document"
}
```

**Internal Changes:**
- Uses Assistants API with file_search tool
- Creates temporary assistant for each request
- Polls for completion (may be slightly slower but more accurate)
- Automatically cleans up assistants after use

### Error Handling

New error case:
```json
{
  "error": "This material doesn't have file search enabled. Please re-upload the document."
}
```

This happens if a material was created before migration and hasn't been migrated yet.

**Solution:** Run the migration script or re-upload the document.

## Backward Compatibility

### Materials Without Vector Stores
Old materials without `vector_store_id` will return an error when trying to chat.

**Solutions:**
1. Run migration script (recommended)
2. Re-upload the document
3. User can still generate questions and notes (those don't require vector stores)

### Existing Functionality
All existing features continue to work:
- ✅ File upload (now creates vector stores)
- ✅ Question generation (unchanged)
- ✅ Notes generation (unchanged)
- ✅ Notes chat (unchanged)
- ✅ Document chat (improved with Assistants API)

## Performance Considerations

### Response Time
- **Chat**: May be slightly slower due to polling (1-3 seconds typically)
- **Questions/Notes**: Same speed as before
- **Upload**: Slightly slower (creates vector store)

### Cost
- **Vector Stores**: $0.10 per GB per day
- **File Search**: $0.20 per search (included in assistant API call)
- **Overall**: Slightly higher cost but supports much larger documents

### Scaling
- Max 10,000 files per vector store
- Max 512MB per file
- Automatic cleanup of temporary assistants

## Troubleshooting

### "This material doesn't have file search enabled"
**Cause:** Material created before migration
**Solution:** Run migration script or re-upload

### Migration script fails for some materials
**Cause:** OpenAI file may no longer exist
**Solution:** Re-upload those specific materials

### Chat responses are slow
**Cause:** Large documents require more processing
**Solution:** This is expected for 500+ page documents. Consider splitting very large documents.

### Rate limits hit during migration
**Cause:** Too many materials migrated at once
**Solution:** Script includes 1-second delay between materials. For large batches, consider running in chunks.

## Monitoring

Monitor these metrics post-migration:
- Average chat response time
- Vector store storage costs
- File search API calls
- Error rates on chat endpoint

## Rollback Plan

If issues occur, you can rollback:

1. **Restore old chat endpoint:**
```bash
mv app/api/materials/[id]/chat/route-old.ts app/api/materials/[id]/chat/route.ts
```

2. **Continue using vector stores for uploads** (keep the improvement)

3. **Database columns are safe** (nullable, won't break old code)

## Future Improvements

Potential enhancements:
- Persistent assistants per material (reuse instead of create/delete)
- Streaming responses for chat (use `runAssistantWithFileSearchStreaming`)
- Migrate question generation to use file search for very large documents
- Thread management for multi-turn conversations

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review migration script output
- Test with small documents first
- Ensure environment variables are set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`

## References

- [OpenAI Assistants API Documentation](https://platform.openai.com/docs/assistants/overview)
- [File Search Tool](https://platform.openai.com/docs/assistants/tools/file-search)
- [Vector Stores](https://platform.openai.com/docs/api-reference/vector-stores)
