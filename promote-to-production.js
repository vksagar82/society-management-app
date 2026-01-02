/**
 * Manual Vercel Production Promotion Script
 *
 * This script promotes the latest preview deployment to production
 * Use this when GitHub Actions promotion fails or to manually control production releases
 */

import https from "https";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_TOKEN) {
  console.error("❌ Error: VERCEL_TOKEN environment variable is required");
  console.log('Set it with: $env:VERCEL_TOKEN="your-token"');
  process.exit(1);
}

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getDeployments() {
  console.log("🔍 Fetching deployments...");

  const options = {
    hostname: "api.vercel.com",
    path: VERCEL_PROJECT_ID
      ? `/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=20`
      : "/v6/deployments?limit=20",
    method: "GET",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  const response = await makeRequest(options);

  if (response.statusCode !== 200) {
    console.error("❌ Failed to fetch deployments:", response.data);
    process.exit(1);
  }

  return response.data.deployments;
}

async function promoteDeployment(deploymentId) {
  console.log(`\n🚀 Promoting deployment ${deploymentId} to production...`);

  const options = {
    hostname: "api.vercel.com",
    path: `/v13/deployments/${deploymentId}/promote`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  const response = await makeRequest(options, {});

  if (response.statusCode === 200 || response.statusCode === 201) {
    console.log("✅ Successfully promoted to production!");
    return true;
  } else {
    console.error("❌ Failed to promote:", response.data);
    return false;
  }
}

async function main() {
  console.log("🎯 Vercel Production Promotion Tool\n");

  const deployments = await getDeployments();

  if (!deployments || deployments.length === 0) {
    console.log("❌ No deployments found");
    process.exit(1);
  }

  // Find the latest ready deployment on master branch
  const latestMaster = deployments.find(
    (d) =>
      d.state === "READY" &&
      (d.meta?.githubCommitRef === "master" ||
        d.meta?.githubCommitRef === "main")
  );

  if (!latestMaster) {
    console.log("❌ No ready deployments found on master/main branch");
    console.log("\nAvailable deployments:");
    deployments.slice(0, 5).forEach((d, i) => {
      console.log(
        `  ${i + 1}. ${d.uid} - ${d.state} - ${
          d.meta?.githubCommitRef || "unknown branch"
        } - ${new Date(d.created).toLocaleString()}`
      );
    });
    process.exit(1);
  }

  console.log(`\n📦 Latest master deployment found:`);
  console.log(`   ID: ${latestMaster.uid}`);
  console.log(`   State: ${latestMaster.state}`);
  console.log(`   Branch: ${latestMaster.meta?.githubCommitRef}`);
  console.log(`   Commit: ${latestMaster.meta?.githubCommitMessage || "N/A"}`);
  console.log(`   URL: ${latestMaster.url}`);
  console.log(`   Created: ${new Date(latestMaster.created).toLocaleString()}`);

  const success = await promoteDeployment(latestMaster.uid);

  if (success) {
    console.log("\n🎉 Deployment promoted to production successfully!");
    console.log("   Your production site should update in a few seconds.");
  } else {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
