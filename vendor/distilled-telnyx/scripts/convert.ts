#!/usr/bin/env -S node --conditions=bun
/**
 * convert — Telnyx's OpenAPI description → Smithy JSON models.
 *
 * Telnyx publishes ONE OpenAPI 3.1 document (`openapi/spec3.json` in
 * team-telnyx/openapi, mirrored to `specs/spec-mirror-telnyx/specs/openapi.json`)
 * covering ~1,550 operations across ~240 tags. Like Hetzner, the v1 layout
 * wants one Smithy model — one service module — per tag:
 *
 *   1. Read the full spec.
 *   2. Bucket operations by PRIMARY (first) tag.
 *   3. Convert each bucket through the shared `convertOpenApiToSmithy` and
 *      write `.generated-specs/<tag_slug>.json`; buckets left empty (all
 *      deprecated) are dropped.
 *   4. `finalizeConvert` applies patches/ and the deferred verbNoun names.
 *
 * Pagination is not stamped here: Telnyx mixes six paging styles (a
 * `page` deepObject, `page[number]`/`page[size]`, `page`/`page_size`,
 * cursors in `page[after]`, `page_cursor`, `page[cursor]`), most of which
 * core's strategies can't drive from a flat input token. Callers page
 * explicitly.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { clearModels, writeModel } from "@distilled.cloud/dev/codegen/models";
import { convertOpenApiToSmithy } from "@distilled.cloud/dev/codegen/openapi";
import { finalizeConvert } from "@distilled.cloud/dev/codegen/patches";
import { resolveSpecPath } from "@distilled.cloud/dev/codegen/spec-path";

const rootDir = path.resolve(import.meta.dirname, "..");
const specPath = resolveSpecPath(rootDir, "specs/spec-mirror-telnyx/specs/openapi.json");
const outDir = path.join(rootDir, ".generated-specs");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

/** Tag → module slug: `Porting Orders` → `porting_orders`, `10DLC` → `n10dlc`. */
const toSlug = (tag: string): string => {
  const slug = tag
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return /^\d/.test(slug) ? `n${slug}` : slug;
};

const toPascal = (slug: string): string =>
  slug
    .split("_")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

if (!fs.existsSync(specPath)) {
  throw new Error(
    `${specPath} not found — run \`pnpm --filter @distilled.cloud/telnyx run specs:fetch\``,
  );
}
const fullSpec = JSON.parse(fs.readFileSync(specPath, "utf-8"));

// ---- deepObject query parameters → bracketed scalars ----------------------
/**
 * Telnyx lists take `filter[...]` and `page[...]` query parameters. The spec
 * declares some as flat parameters named `page[number]`, and others as one
 * `style: deepObject` object parameter. Core's `DeepQuery` binding encodes
 * nested keys DOTTED (`page.number`, which Cloudflare's API expects), while
 * OpenAPI's deepObject style — and Telnyx — use BRACKETS (`page[number]`).
 * So each deepObject query parameter is expanded into the flat bracketed
 * parameters it stands for, the form the rest of this spec already uses.
 * This is spec-generic: it keys on `style: deepObject`, not on names.
 */
const resolveRef = (node: any): any => {
  let n = node;
  for (let i = 0; i < 10 && n?.$ref; i++) {
    n = n.$ref
      .replace(/^#\//, "")
      .split("/")
      .reduce((acc: any, k: string) => acc?.[k.replace(/~1/g, "/").replace(/~0/g, "~")], fullSpec);
  }
  return n;
};
const expandDeep = (name: string, schema: any, description: string | undefined, out: any[]) => {
  const s = resolveRef(schema) ?? {};
  const props = s.properties as Record<string, any> | undefined;
  if (s.type === "object" && props && Object.keys(props).length > 0) {
    for (const [k, v] of Object.entries(props)) {
      const resolved = resolveRef(v) ?? {};
      expandDeep(`${name}[${k}]`, v, resolved.description ?? description, out);
    }
    return;
  }
  out.push({ name, in: "query", required: false, schema, ...(description ? { description } : {}) });
};
let expandedDeep = 0;
for (const pathItem of Object.values<Record<string, any>>(fullSpec.paths)) {
  for (const holder of [pathItem, ...HTTP_METHODS.map((m) => pathItem[m]).filter(Boolean)]) {
    if (!Array.isArray(holder.parameters)) continue;
    const next: any[] = [];
    for (const raw of holder.parameters) {
      const p = resolveRef(raw);
      if (p?.in === "query" && p?.style === "deepObject") {
        const expanded: any[] = [];
        expandDeep(p.name, p.schema, p.description, expanded);
        const taken = new Set(holder.parameters.map((x: any) => resolveRef(x)?.name));
        next.push(...expanded.filter((e) => !taken.has(e.name)));
        expandedDeep++;
      } else {
        next.push(raw);
      }
    }
    holder.parameters = next;
  }
}
console.log(`🔧 ${expandedDeep} deepObject query parameter(s) expanded to bracketed params`);

const tagBuckets = new Map<string, Record<string, Record<string, unknown>>>();
const unrouted: string[] = [];
for (const [pathTemplate, pathItem] of Object.entries<Record<string, unknown>>(fullSpec.paths)) {
  for (const method of HTTP_METHODS) {
    const op = (pathItem as Record<string, any>)[method];
    if (!op) continue;
    const rawTag: string | undefined =
      Array.isArray(op.tags) && op.tags.length > 0 ? op.tags[0] : undefined;
    if (rawTag === undefined) unrouted.push(`${method.toUpperCase()} ${pathTemplate}`);
    const slug = toSlug(rawTag ?? "misc") || "misc";
    if (!tagBuckets.has(slug)) tagBuckets.set(slug, {});
    const bucketPaths = tagBuckets.get(slug)!;
    if (!bucketPaths[pathTemplate]) {
      const pathParams = (pathItem as Record<string, any>).parameters;
      bucketPaths[pathTemplate] = pathParams ? { parameters: pathParams } : {};
    }
    (bucketPaths[pathTemplate] as Record<string, unknown>)[method] = op;
  }
}
if (unrouted.length) {
  console.warn(`   ⚠️  ${unrouted.length} untagged operation(s) fell into \`misc\``);
}

clearModels(outDir);
let written = 0;
let totalOps = 0;
const emptyBuckets: string[] = [];
for (const slug of [...tagBuckets.keys()].sort()) {
  const paths = tagBuckets.get(slug)!;
  const model = convertOpenApiToSmithy(
    { ...fullSpec, paths },
    {
      deferNaming: true,
      namespace: `com.telnyx.${slug}`,
      serviceName: toPascal(slug),
      skipDeprecated: true,
      binaryTypes: true,
      // `If-Match` (AI gateway optimistic concurrency) and other header params.
      headerParams: true,
    },
  );
  const operations = Object.values<any>(model.shapes).filter((s) => s.type === "operation");
  if (operations.length === 0) {
    emptyBuckets.push(slug);
    continue;
  }
  writeModel(path.join(outDir, `${slug}.json`), model);
  written++;
  totalOps += operations.length;
}
if (emptyBuckets.length) {
  console.log(`   (${emptyBuckets.length} tag(s) dropped — every operation deprecated)`);
}
console.log(`✅ ${written} Smithy models (${totalOps} operations) → ${outDir}`);

await finalizeConvert({ root: rootDir });
