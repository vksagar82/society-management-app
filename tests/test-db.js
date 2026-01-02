// Load .env.local if it exists (local development), otherwise use env vars from CI/CD
require("dotenv").config({ path: ".env.local", silent: true });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl =
  process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl ? "Found" : "MISSING");
console.log("Key:", supabaseKey ? "Found" : "MISSING");

if (!supabaseUrl || !supabaseKey) {
  console.error("\n❌ Environment variables not loaded!");
  console.error("Make sure environment variables are set:");
  console.error("  SUPABASE_URL or NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL");
  console.error("  SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  console.log("\n🔍 Checking users table...");

  const { data, error, count } = await supabase
    .from("users")
    .select("email, role, is_active", { count: "exact" })
    .limit(10);

  if (error) {
    console.error("\n❌ Error querying users table:", error.message);
    console.error("\n💡 You need to run the SQL migrations first:");
    console.error(
      "   1. Go to Supabase dashboard: https://supabase.com/dashboard"
    );
    console.error("   2. Select your project");
    console.error("   3. Go to SQL Editor");
    console.error("   4. Run database/schema.sql");
    console.error("   5. Run database/AUTH_MIGRATIONS.sql");
  } else {
    console.log("\n✅ Users table found!");
    console.log(`Total users: ${count || 0}`);
    if (data && data.length > 0) {
      console.log("\nExisting users:");
      data.forEach((user) => {
        console.log(
          `  - ${user.email} (${user.role}) ${user.is_active ? "✓" : "✗"}`
        );
      });
    } else {
      console.log("\n⚠️  No users found in database!");
      console.log("Run database/AUTH_MIGRATIONS.sql to create test users");
    }
  }
})();
