#!/usr/bin/env -S node --conditions=bun
/**
 * generate — compile the Smithy models from scripts/convert.ts into the
 * Telnyx Effect SDK: one module per tag under src/services/.
 *
 * Telnyx keeps its wire member names verbatim (mostly snake_case, some
 * camelCase in the 10DLC API) on the TS surface, so there is no renaming.
 */
import { runGeneratorCli } from "@distilled.cloud/dev/codegen/cli";
import type { SdkSpec } from "@distilled.cloud/dev/codegen/generator";
import { JSON_PRELUDE, TS_JSON_PRELUDE } from "@distilled.cloud/dev/codegen/prelude";

const NULLABLE_TRAIT = "com.distilled.openapi#nullable";
const ERROR_MATCHERS_TRAIT = "com.distilled.openapi#errorMatchers";
const RAW_RESPONSE_TRAIT = "com.distilled.openapi#rawResponse";
const SENSITIVE_TRAIT = "smithy.api#sensitive";

/** `porting_orders` → `portingOrders` (the barrel's export name). */
const camel = (slug: string): string =>
  slug
    .split("_")
    .filter(Boolean)
    .map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join("");

const spec: SdkSpec = {
  schemaType: "Codec",
  nullableTrait: NULLABLE_TRAIT,
  errorMatchersTrait: ERROR_MATCHERS_TRAIT,
  prelude: {
    ...JSON_PRELUDE,
    Blob: "S.Union([S.instanceOf(Blob), S.instanceOf(Uint8Array), S.instanceOf(ArrayBuffer)])",
  },
  tsPrelude: {
    ...TS_JSON_PRELUDE,
    Blob: "Blob | Uint8Array | ArrayBuffer",
  },
  extraBindings: [
    {
      trait: RAW_RESPONSE_TRAIT,
      binding: "rawResponse",
      pipe: "T.RawResponse()",
      rootPipe: "T.RawResponseRoot()",
    },
  ],
  // Secrets: Redacted on the way out, `string | Redacted` accepted on the way in.
  memberTraitPipes: {
    [SENSITIVE_TRAIT]: "T.SensitiveValue",
  },
  memberSchema: (m, ref) =>
    SENSITIVE_TRAIT in m.traits
      ? `S.Union([${ref(m.target)}, S.Redacted(${ref(m.target)}, { disallowJsonEncode: true })])`
      : undefined,
  memberTsType: (m) =>
    SENSITIVE_TRAIT in m.traits
      ? `string | Redacted.Redacted<string>${m.nullable ? " | null" : ""}`
      : undefined,
  // A bare binary response (a KV value) is the bytes themselves.
  shapeOverride: ({ name, def }) => {
    if (
      def.type === "structure" &&
      Object.keys(def.members ?? {}).length === 1 &&
      def.members.body?.target === "smithy.api#Blob" &&
      RAW_RESPONSE_TRAIT in (def.members.body.traits ?? {})
    ) {
      return [
        `export type ${name} = Uint8Array;`,
        `export const ${name} = S.instanceOf(Uint8Array).pipe(T.BinaryResponse()) as S.Codec<${name}>;`,
      ];
    }
    return undefined;
  },
  // oneOf/anyOf unions decode passthrough: the TS type is the case union.
  union: ({ name, caseTargets, tsRef }) => [
    `export type ${name} = ${caseTargets.map(tsRef).join(" | ") || "unknown"};`,
    `export const ${name} = S.Unknown as any as S.Codec<${name}>;\n`,
  ],
  sourceNote: ".generated-specs (specs/spec-mirror-telnyx/specs/openapi.json)",
  operationDecl: {
    contextType: "TelnyxOpContext",
    commonErrorType: "TelnyxOpError",
    commonErrorClasses: ["UnknownTelnyxError"],
    protocol: "TelnyxProtocol",
    retry: "Retry.Retry",
  },
  postProcess: (code) =>
    code.includes("Redacted.Redacted<")
      ? code.replace(
          `import * as S from "@distilled.cloud/core/schema-lite";\n`,
          `import * as S from "@distilled.cloud/core/schema-lite";\nimport * as Redacted from "effect/Redacted";\n`,
        )
      : code,
};

runGeneratorCli({
  description: "Generate the Telnyx Effect SDK from the Smithy models",
  convert: () => import("./convert.ts"),
  root: `${import.meta.dirname}/..`,
  patchesDir: false,
  barrelExportName: camel,
  spec: () => spec,
});
