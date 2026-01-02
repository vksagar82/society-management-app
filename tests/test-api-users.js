// Load .env.local if it exists (local development), otherwise use env vars from CI/CD
require("dotenv").config({ path: ".env.local", silent: true });
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY || !JWT_SECRET) {
  console.error("❌ Missing required environment variables:");
  if (!SUPABASE_URL)
    console.error("  - SUPABASE_URL or NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL");
  if (!SUPABASE_KEY) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  if (!JWT_SECRET) console.error("  - JWT_SECRET");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateToken(userId) {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

(async () => {
  console.log("\n🔍 Testing /api/users endpoint...\n");

  // Get admin user
  const { data: admin } = await supabase
    .from("users")
    .select("*")
    .eq("email", "admin@test.com")
    .single();

  if (!admin) {
    console.log("❌ Admin user not found!");
    return;
  }

  console.log(`✅ Found admin: ${admin.email}`);
  console.log(`   User ID: ${admin.id}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Society ID: ${admin.society_id || "NULL"}`);

  // Generate token
  const token = generateToken(admin.id);
  console.log(`\n🔑 Generated token: ${token.substring(0, 50)}...`);

  // Test API call
  console.log("\n📡 Testing API call to /api/users...");

  const apiUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/api/users`;
  console.log(`   URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      if (response.ok) {
        console.log(`\n✅ Success! Found ${data.length} users:`);
        data.forEach((u) => {
          console.log(`   - ${u.email} (${u.role})`);
        });
      } else {
        console.log(`\n❌ Error:`, data);
      }
    } catch (e) {
      console.log(`\n❌ Invalid JSON response:`, text.substring(0, 200));
      console.log(`\nFull response: ${text}`);
    }
  } catch (error) {
    console.log(`\n❌ Fetch failed:`, error.message);
    console.log("\n💡 Make sure the dev server is running: npm run dev");
  }
})();
