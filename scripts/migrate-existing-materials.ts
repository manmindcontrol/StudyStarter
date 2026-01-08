/**
 * Migration Script: Add Vector Stores to Existing Materials
 *
 * This script migrates existing materials that only have openai_file_id
 * to also have vector_store_id for enhanced file search capabilities.
 *
 * Run with: npx tsx scripts/migrate-existing-materials.ts
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

async function migrateMaterials() {
  console.log("🔄 Starting migration of existing materials to Assistants API...\n");

  // 1. Find all materials without vector_store_id but with openai_file_id
  const { data: materials, error } = await supabase
    .from("materials")
    .select("id, title, openai_file_id, vector_store_id")
    .is("vector_store_id", null)
    .not("openai_file_id", "is", null);

  if (error) {
    console.error("❌ Error fetching materials:", error);
    return;
  }

  if (!materials || materials.length === 0) {
    console.log("✅ No materials need migration!");
    return;
  }

  console.log(`📊 Found ${materials.length} materials to migrate\n`);

  // 2. Migrate each material
  let successCount = 0;
  let failCount = 0;

  for (const material of materials) {
    try {
      console.log(`\n📄 Migrating: ${material.title} (ID: ${material.id})`);
      console.log(`   OpenAI File ID: ${material.openai_file_id}`);

      // Create vector store for this file
      // @ts-expect-error - Vector stores API may not be available in current OpenAI SDK version
      const vectorStore = await openai.beta.vectorStores?.create({
        name: `${material.title} - Vector Store`,
        file_ids: [material.openai_file_id],
      });

      console.log(`   ✅ Created vector store: ${vectorStore.id}`);

      // Update database
      const { error: updateError } = await supabase
        .from("materials")
        .update({
          vector_store_id: vectorStore.id,
          file_search_enabled: true,
        })
        .eq("id", material.id);

      if (updateError) {
        console.error(`   ❌ Database update failed:`, updateError);
        failCount++;
      } else {
        console.log(`   ✅ Database updated successfully`);
        successCount++;
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`   ❌ Migration failed:`, err);
      failCount++;
    }
  }

  // 3. Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Migration Summary:");
  console.log(`   ✅ Successfully migrated: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📈 Total processed: ${materials.length}`);
  console.log("=".repeat(50) + "\n");

  if (successCount > 0) {
    console.log("🎉 Migration completed! Your existing materials now support:");
    console.log("   - Large document processing (500+ pages)");
    console.log("   - Automatic vector search");
    console.log("   - Enhanced AI responses with file_search");
  }
}

// Run migration
migrateMaterials()
  .then(() => {
    console.log("\n✅ Migration script finished!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
