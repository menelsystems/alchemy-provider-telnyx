# Vendored Telnyx SDK (`@distilled.cloud/telnyx`)

An Effect-native Telnyx SDK generated with [distilled](https://github.com/alchemy-run/distilled)'s
own OpenAPI → Smithy → SDK pipeline, the same one behind every first-party Alchemy
provider. Telnyx isn't in distilled upstream, so we run the pipeline ourselves and
vendor the output here.

- **Spec:** `openapi/spec3.json` from [team-telnyx/openapi](https://github.com/team-telnyx/openapi),
  pinned to a commit in `spec-repo/fetch-specs.ts` (the same commit terraform-provider-telnyx pins).
- **Generator:** distilled at tag `v1.0.0-rc.20`, matching the published `@distilled.cloud/core`
  this package depends on at runtime.
- **Layout:** one module per Telnyx API tag under `src/services/` (~240 modules, ~1,550 operations).

| Path | What | Edit? |
|---|---|---|
| `src/services/` | Generated operations and types | Never: regenerate |
| `src/{credentials,errors,protocol,retry,traits,index}.ts` | Hand-written runtime (auth, error envelope) | Yes |
| `scripts/convert.ts`, `scripts/generate.ts` | This package's distilled convert/generate config | Yes |
| `patches/<module>/*.patch.json` | RFC-6902 fixes to the converted Smithy model | Yes, with evidence |
| `spec-repo/` | The spec fetch script (distilled's spec-mirror layout) | Yes, to move the pin |

## Regenerating

```sh
vendor/distilled-telnyx/regenerate.sh
```

Needs git, Node 24+ and pnpm. It clones distilled at the pinned tag into a temp dir (or uses
`DISTILLED_DIR`), drops this package in, fetches the spec, runs `pnpm generate telnyx` and copies
`src/services/` back.

## Patches

- `kv_keys/put-kv-key-value.patch.json`: `PUT /storage/kvs/{id}/keys/{key}` takes the value as a raw
  `application/octet-stream` body, which the converter doesn't read, so the patch adds it as a
  payload member.
