#!/usr/bin/env node
/**
 * Mirrors the Telnyx API spec into ../specs/.
 *
 * Only the 1 file the distilled telnyx generator actually reads
 * is downloaded, straight from raw.githubusercontent.com — the upstream
 * repository is never cloned, so the mirror stays exactly as large as the
 * spec itself.
 *
 * Usage:
 *   node fetch-specs.ts
 *
 * Specs are saved to:
 *   ../specs/openapi.json
 */

import { mkdirSync } from "fs";
import { writeFile } from "fs/promises";

/** Upstream repository, as `<owner>/<repo>`. */
const REPO = "team-telnyx/openapi";
/** Branch (or tag/commit) to mirror. */
const REF = "bf2eb8ed5b816213987fecae8fe33329e98cdd84";

interface SpecFile {
  /** Path within {@link REPO}. */
  path: string;
  /** Path within ../specs/ to write it to. */
  output: string;
}

const FILES: SpecFile[] = [{ path: "openapi/spec3.json", output: "openapi.json" }];

const SPECS_DIR = "../specs";

mkdirSync(SPECS_DIR, { recursive: true });

/**
 * The raw URL for a path in {@link REPO}. Each segment is encoded
 * individually so paths containing characters like `(` survive the round
 * trip while the separators do not.
 */
const rawUrl = (path: string) =>
  `https://raw.githubusercontent.com/${REPO}/${REF}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

async function main() {
  for (const file of FILES) {
    const url = rawUrl(file.path);
    console.log(`Fetching ${url}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    // Validate before writing: a rate-limit or error page is still a body.
    const spec = (await response.json()) as { openapi?: unknown; paths?: unknown };
    if (typeof spec.openapi !== "string" || spec.paths === undefined) {
      throw new Error(`${url} is not an OpenAPI document`);
    }
    const outputPath = `${SPECS_DIR}/${file.output}`;
    console.log(`Writing ${outputPath}...`);
    await writeFile(outputPath, JSON.stringify(spec, null, 2) + "\n");
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
