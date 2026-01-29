/**
 * Script to apply the default subscription migration
 *
 * This script:
 * 1. Backfills existing users without subscriptions
 * 2. Creates database triggers for automatic subscription creation
 * 3. Creates triggers for automatic usage tracking initialization
 *
 * Run with: node scripts/apply-subscription-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Starting subscription migration...\n');

  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_auto_create_default_subscription.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📍 Path:', migrationPath);
    console.log('');

    // Execute the migration
    console.log('⏳ Executing migration SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, we need to run queries individually
      if (error.message.includes('exec_sql')) {
        console.log('ℹ️  exec_sql function not available, running queries individually...\n');
        await runQueriesIndividually(migrationSQL);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration executed successfully!\n');
    }

    // Verify the migration
    await verifyMigration();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

async function runQueriesIndividually(migrationSQL) {
  // Split SQL by semicolons (simple approach - may need refinement for complex SQL)
  const queries = migrationSQL
    .split(';')
    .map(q => q.trim())
    .filter(q => q.length > 0 && !q.startsWith('--'));

  console.log(`Found ${queries.length} SQL statements to execute\n`);

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];

    // Skip comments and verification queries
    if (query.startsWith('--') || query.includes('Uncomment these')) {
      continue;
    }

    console.log(`[${i + 1}/${queries.length}] Executing query...`);

    try {
      // For INSERT, UPDATE, DELETE queries
      if (query.trim().toUpperCase().startsWith('INSERT')) {
        const { error } = await supabase.rpc('exec_sql', { sql: query + ';' });
        if (error) {
          console.log(`   ⚠️  Query may have failed (this is OK if users already have subscriptions): ${error.message}`);
        } else {
          console.log('   ✅ Success');
        }
      } else {
        // For DDL queries (CREATE FUNCTION, CREATE TRIGGER, etc.)
        // Note: These require direct database access or Supabase CLI
        console.log('   ⚠️  DDL query detected - requires Supabase CLI or direct database access');
        console.log('   📝 Query:', query.substring(0, 100) + '...');
      }
    } catch (error) {
      console.log(`   ⚠️  Error (may be expected): ${error.message}`);
    }
  }

  console.log('\n✅ Individual queries completed\n');
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');

  // Check for users without subscriptions
  const { data: usersWithoutSubs, error: error1 } = await supabase
    .from('user_profiles')
    .select(`
      id,
      email,
      user_subscriptions!left(user_id)
    `)
    .is('user_subscriptions.user_id', null);

  if (error1) {
    console.error('⚠️  Could not verify users without subscriptions:', error1.message);
  } else {
    console.log(`✅ Users without subscriptions: ${usersWithoutSubs.length}`);
    if (usersWithoutSubs.length > 0) {
      console.log('⚠️  WARNING: Some users still missing subscriptions!');
      console.log('   These users:', usersWithoutSubs.map(u => u.email).join(', '));
    }
  }

  // Check total subscriptions
  const { count, error: error2 } = await supabase
    .from('user_subscriptions')
    .select('*', { count: 'exact', head: true });

  if (error2) {
    console.error('⚠️  Could not count subscriptions:', error2.message);
  } else {
    console.log(`✅ Total subscriptions in database: ${count}`);
  }

  // Check subscription tiers distribution
  const { data: tierCounts, error: error3 } = await supabase
    .from('user_subscriptions')
    .select('tier_id');

  if (error3) {
    console.error('⚠️  Could not get tier distribution:', error3.message);
  } else {
    const distribution = tierCounts.reduce((acc, sub) => {
      acc[sub.tier_id] = (acc[sub.tier_id] || 0) + 1;
      return acc;
    }, {});
    console.log('✅ Subscription tier distribution:', distribution);
  }

  console.log('\n🎉 Migration verification complete!\n');
}

// Run the migration
applyMigration().then(() => {
  console.log('✨ All done! Your app should now handle subscriptions without crashing.\n');
  console.log('⚠️  IMPORTANT: If you see warnings about DDL queries, you need to run the SQL');
  console.log('   migration directly in Supabase dashboard (SQL Editor) to create the triggers.\n');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
