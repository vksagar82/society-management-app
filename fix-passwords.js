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
  // Global test users (both societies)
  { email: "developer@test.com", password: "developer123" },
  { email: "admin@test.com", password: "admin123" },
  { email: "manager@test.com", password: "manager123" },
  { email: "member@test.com", password: "member123" },

  // Per-society users
  { email: "admin1@test.com", password: "admin123" },
  { email: "admin2@test.com", password: "admin123" },
  { email: "manager1@test.com", password: "manager123" },
  { email: "manager2@test.com", password: "manager123" },
  { email: "member1@test.com", password: "member123" },
  { email: "member2@test.com", password: "member123" },
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
  console.log("   developer@test.com / developer123");
  console.log("   admin@test.com / admin123");
  console.log("   manager@test.com / manager123");
  console.log("   member@test.com / member123");
  console.log("   admin1@test.com / admin123");
  console.log("   admin2@test.com / admin123");
  console.log("   manager1@test.com / manager123");
  console.log("   manager2@test.com / manager123");
  console.log("   member1@test.com / member123");
  console.log("   member2@test.com / member123");
})();
