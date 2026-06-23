const fs = require('fs');
const { v2: cloudinary } = require("cloudinary");

const envVars = {};
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
});

cloudinary.config({
  cloud_name: envVars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY_API_SECRET,
});

async function run() {
  try {
    const res = await cloudinary.api.ping();
    console.log("Cloudinary ping:", res);
  } catch (err) {
    console.error("Cloudinary error:", err);
  }
}

run();
