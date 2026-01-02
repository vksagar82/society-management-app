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

const testUsers = [
  { email: "admin@test.com", password: "admin123" },
  { email: "manager@test.com", password: "manager123" },
  { email: "member@test.com", password: "member123" },
];

(async () => {
  console.log("\n🔧 Updating password hashes in database...\n");

  for (const user of testUsers) {
    const hash = hashPassword(user.password);

    const { error } = await supabase
      .from("users")
      .update({ password_hash: hash })
      .eq("email", user.email);

    if (error) {
      console.log(`❌ Failed to update ${user.email}:`, error.message);
    } else {
      console.log(`✅ Updated ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Hash: ${hash}\n`);
    }
  }

  console.log("✅ Password hashes updated! You can now login with:");
  console.log("   admin@test.com / admin123");
  console.log("   manager@test.com / manager123");
  console.log("   member@test.com / member123");
})();
