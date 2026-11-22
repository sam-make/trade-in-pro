#!/usr/bin/env bash
set -euo pipefail

# Workers Builds runs this command ONLY for branch Previews, never for production.
# The public Supabase values come from protected Cloudflare Build variables, not Git.
# Without explicit Preview vars, Wrangler can deploy a new Preview with no runtime
# bindings even when the parent production Worker has those bindings.
expected_url="https://xuvaihwygkcwriqfnkbg.supabase.co"
if [[ "${VITE_SUPABASE_URL:-}" != "$expected_url" ]]; then
  echo "::error::La variable VITE_SUPABASE_URL de la Preview est absente ou inattendue."
  exit 1
fi
if [[ "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" != sb_publishable_* ]]; then
  echo "::error::Clé publique Supabase absente ou de type inattendu."
  exit 1
fi

preview_config="$(mktemp "./.wrangler-preview.XXXXXXXX.json")"
chmod 600 "$preview_config"
cleanup() {
  rm -f "$preview_config"
}
trap cleanup EXIT

# Generate a temporary Wrangler config alongside wrangler.jsonc so relative
# paths resolve correctly. The generated file is deleted, never committed.
node - "$preview_config" "${1:-}" <<'NODE'
const fs = require("node:fs");
const filename = process.argv[2];
const config = JSON.parse(fs.readFileSync("wrangler.jsonc", "utf8"));
if (config.name !== "trade-in-pro") {
  throw new Error("Unexpected Cloudflare Worker name");
}
const vars = {
  ...(config.previews?.vars || {}),
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};
if ("SUPABASE_SERVICE_ROLE_KEY" in vars) {
  throw new Error("The service role key must never be a Preview plaintext var");
}
config.previews = { ...(config.previews || {}), vars };
fs.writeFileSync(filename, JSON.stringify(config, null, 2), { mode: 0o600 });

// The Cloudflare Vite plugin redirects Wrangler to its GENERATED deployment
// config (dist/server/wrangler.json). Editing the source config alone is not
// sufficient: the redirected file must carry the Preview bindings as well.
const generatedPath = "dist/server/wrangler.json";
if (fs.existsSync(generatedPath)) {
  const generated = JSON.parse(fs.readFileSync(generatedPath, "utf8"));
  if (generated.name !== config.name) {
    throw new Error("Redirected Cloudflare Worker name mismatch");
  }
  generated.previews = { ...(generated.previews || {}), vars };
  fs.writeFileSync(generatedPath, JSON.stringify(generated, null, 2), { mode: 0o600 });
} else if (process.argv[3] !== "--verify-only") {
  throw new Error("Compiled Wrangler configuration is missing");
}
NODE

if [[ "${1:-}" == "--verify-only" ]]; then
  node - "$preview_config" <<'NODE'
const fs = require("node:fs");
const config = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const vars = config.previews?.vars || {};
if (vars.SUPABASE_URL !== process.env.VITE_SUPABASE_URL) {
  throw new Error("Preview URL missing from generated runtime vars");
}
if (vars.SUPABASE_PUBLISHABLE_KEY !== process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Preview publishable key missing from generated runtime vars");
}
if ("SUPABASE_SERVICE_ROLE_KEY" in vars) {
  throw new Error("Service role value present in Preview plaintext vars");
}
const generatedPath = "dist/server/wrangler.json";
if (fs.existsSync(generatedPath)) {
  const generated = JSON.parse(fs.readFileSync(generatedPath, "utf8"));
  if (generated.previews?.vars?.SUPABASE_URL !== vars.SUPABASE_URL ||
      generated.previews?.vars?.SUPABASE_PUBLISHABLE_KEY !== vars.SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Vite redirected deploy config is missing Preview bindings");
  }
}
console.log("Configuration Preview validée sans afficher les variables.");
NODE
else
  # The Vite plugin redirects Wrangler to dist/server/wrangler.json through
  # .wrangler/deploy/config.json. Supplying --config bypasses that redirect
  # and makes Wrangler look for a nonexistent source entry-point.
  bunx wrangler preview
fi
