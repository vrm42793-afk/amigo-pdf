const fs = require('fs');
const { createClient } = require("@supabase/supabase-js");

const envVars = {};
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.from("files").select("*").order("created_at", { ascending: false }).limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Files:", data);
  }
}

run();
