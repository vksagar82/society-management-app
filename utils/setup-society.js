require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SOCIETY_MMGTSUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log("\n🏢 Setting up test society and users...\n");

  try {
    // Create a test society
    const { data: societyData, error: societyError } = await supabase
      .from("societies")
      .insert({
        name: "Test Society",
        address: "123 Main Street",
        city: "Test City",
        state: "Test State",
        pincode: "100001",
        contact_person: "Admin",
        contact_email: "admin@test.com",
        contact_phone: "+1234567890",
      })
      .select();

    if (societyError) {
      console.log("❌ Error creating society:", societyError.message);
      return;
    }

    const societyId = societyData[0].id;
    console.log(`✅ Created society: ${societyData[0].name}`);
    console.log(`   ID: ${societyId}\n`);

    // Update test users with society_id
    const { error: updateError } = await supabase
      .from("users")
      .update({ society_id: societyId })
      .in("email", ["admin@test.com", "manager@test.com", "member@test.com"]);

    if (updateError) {
      console.log("❌ Error updating users:", updateError.message);
      return;
    }

    console.log("✅ Updated test users with society_id:");
    console.log(`   - admin@test.com`);
    console.log(`   - manager@test.com`);
    console.log(`   - member@test.com\n`);

    console.log(
      "✅ Setup complete! You can now create AMCs, assets, and issues."
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
})();
