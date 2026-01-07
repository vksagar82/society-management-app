// Load .env.local if it exists (local development), otherwise use env vars from CI/CD
require("dotenv").config({ path: ".env.local", silent: true });
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing required environment variables:");
  if (!SUPABASE_URL)
    console.error("  - SUPABASE_URL or NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL");
  if (!SUPABASE_KEY) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const testCredentials = [
  { email: "admin@test.com", password: "admin123" },
  { email: "manager@test.com", password: "manager123" },
  { email: "member@test.com", password: "member123" },
];

(async () => {
  console.log("\n🔐 Testing login credentials...\n");

  for (const cred of testCredentials) {
    console.log(`Testing: ${cred.email}`);

    // Get user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("email, password_hash")
      .eq("email", cred.email)
      .single();

    if (error || !user) {
      console.log(`  ❌ User not found in database`);
      continue;
    }

    const inputHash = hashPassword(cred.password);
    const storedHash = user.password_hash;

    console.log(`  Input password: ${cred.password}`);
    console.log(`  Generated hash: ${inputHash}`);
    console.log(`  Stored hash:    ${storedHash}`);
    console.log(`  Match: ${inputHash === storedHash ? "✅ YES" : "❌ NO"}`);
    console.log("");
  }

  console.log("\n💡 If hashes don't match, update them with:");
  console.log(
    "   UPDATE users SET password_hash = 'hash' WHERE email = 'email@test.com';"
  );
})();
