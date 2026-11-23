#!/usr/bin/env bash
# Regenerate the vendored Telnyx SDK with distilled's own pipeline.
#
# Clones alchemy-run/distilled at the tag whose @distilled.cloud/core is the
# version this package depends on, drops this package into it, fetches the
# Telnyx OpenAPI spec (pinned in spec-repo/fetch-specs.ts), runs distilled's
# convert + generate, and copies the generated SDK back here.
#
#   vendor/distilled-telnyx/regenerate.sh            # uses a temp checkout
#   DISTILLED_DIR=../distilled vendor/distilled-telnyx/regenerate.sh
set -euo pipefail

TAG="v1.0.0-rc.20" # must match the @distilled.cloud/core version in package.json
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${DISTILLED_DIR:-$(mktemp -d)/distilled}"

if [ ! -d "$WORK/.git" ]; then
  git clone --depth 1 --branch "$TAG" https://github.com/alchemy-run/distilled.git "$WORK"
fi
cd "$WORK"

PKG=packages/telnyx
mkdir -p "$PKG" stacks/distilled-submodules/spec-repos/telnyx
rm -rf "$PKG/src" "$PKG/scripts" "$PKG/patches"
cp -R "$HERE/src" "$HERE/scripts" "$HERE/patches" "$HERE/package.json" \
  "$HERE/tsconfig.json" "$HERE/tsconfig.scripts.json" "$PKG/"
cp "$HERE"/spec-repo/* stacks/distilled-submodules/spec-repos/telnyx/

# Register the package (idempotent).
grep -q '{ package: "telnyx" }' stacks/distilled-submodules/SpecRepos.ts ||
  sed -i.bak 's/  { package: "temporal" },/  { package: "telnyx" },\n  { package: "temporal" },/' \
    stacks/distilled-submodules/SpecRepos.ts
grep -q 'packages/telnyx/tsconfig.json' tsconfig.json ||
  node -e '
    const fs = require("fs"); const p = "tsconfig.json"; let s = fs.readFileSync(p, "utf8");
    const a = `"path": "./packages/neon/tsconfig.scripts.json"\n    },`;
    s = s.replace(a, a + `\n    {\n      "path": "./packages/telnyx/tsconfig.json"\n    },\n    {\n      "path": "./packages/telnyx/tsconfig.scripts.json"\n    },`);
    fs.writeFileSync(p, s);'

pnpm install --frozen-lockfile=false
pnpm specs:local telnyx
DISTILLED_SPECS_LOCAL=1 pnpm generate telnyx

rm -rf "$HERE/src/services"
cp -R "$PKG/src/services" "$HERE/src/"
cp "$PKG/package.json" "$HERE/package.json"
echo "✅ regenerated $(ls "$HERE/src/services" | wc -l | tr -d ' ') service modules from $TAG"
