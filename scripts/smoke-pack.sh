#!/usr/bin/env bash
# Pack the package exactly as npm would publish it, install the tarball into a
# fresh project with plain npm, then:
#   1. import it under Node (no Bun) and make a real SDK call through the
#      compiled lib/ against a local HTTP stub;
#   2. typecheck a consumer with strict `nodenext` resolution, proving the
#      published .d.ts files resolve (a @ts-expect-error fails if they don't).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$ROOT"
[ -f lib/src/index.js ] || { echo "lib/ is missing: run \`bun run build\` first" >&2; exit 1; }
TARBALL="$(npm pack --silent --pack-destination "$WORK" | tail -1)"
echo "packed $TARBALL ($(du -h "$WORK/$TARBALL" | cut -f1))"

ALCHEMY="$(node -p "require('./package.json').devDependencies.alchemy")"
EFFECT="$(node -p "require('./package.json').devDependencies.effect")"
TS="$(node -p "require('./package.json').devDependencies.typescript")"

cd "$WORK"
cat > package.json <<JSON
{ "name": "smoke", "private": true, "type": "module" }
JSON
npm install --silent --no-audit --no-fund "./$TARBALL" "alchemy@$ALCHEMY" "effect@$EFFECT" "typescript@$TS" @types/node

# 1. Runtime under Node.
cat > run.mjs <<'JS'
import { createServer } from "node:http";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as FetchHttpClient from "effect/http/FetchHttpClient";
import * as Telnyx from "alchemy-provider-telnyx";
import * as Profiles from "alchemy-provider-telnyx/api/profiles";
import Contributions from "alchemy-provider-telnyx/Contributions";

const server = createServer((req, res) => {
  if (req.headers.authorization !== "Bearer KEY") return res.writeHead(401).end();
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ data: { id: "mp_1", name: "smoke", v1_secret: "s" } }));
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}/v2`;

const profile = await Effect.runPromise(
  Profiles.getMessagingProfile({ id: "mp_1" }).pipe(
    Effect.provide(
      Layer.mergeAll(
        FetchHttpClient.layer,
        Telnyx.Credentials.fromApiKey({ apiKey: Redacted.make("KEY"), apiBaseUrl: base }),
      ),
    ),
  ),
);
server.close();

const checks = {
  "SDK call through lib/": profile.data?.name === "smoke",
  "secrets arrive redacted": Redacted.isRedacted(profile.data?.v1_secret),
  "resources exported": typeof Telnyx.Messaging.Profile === "function",
  "providers() builds a layer": Layer.isLayer(Telnyx.providers()),
  "Contributions module": Contributions?.name === "telnyx",
};
for (const [name, ok] of Object.entries(checks)) console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
if (Object.values(checks).some((ok) => !ok)) process.exit(1);
JS
node run.mjs

# 2. Types for a consumer with strict Node resolution.
cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "es2022",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "files": ["consumer.ts"]
}
JSON
cat > consumer.ts <<'TS'
import * as Telnyx from "alchemy-provider-telnyx";
import * as Profiles from "alchemy-provider-telnyx/api/profiles";

export const props: Telnyx.Messaging.ProfileProps = {
  name: "app-sms",
  whitelisted_destinations: ["US"],
};
// If the published types failed to resolve they'd be `any`, and this line
// would no longer be an error.
// @ts-expect-error name must be a string
export const bad: Telnyx.Messaging.ProfileProps = { name: 1, whitelisted_destinations: [] };
export const op: typeof Profiles.getMessagingProfile = Profiles.getMessagingProfile;
TS
npx tsc -p tsconfig.json
echo "ok   consumer typechecks with nodenext resolution"
