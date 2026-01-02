require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
