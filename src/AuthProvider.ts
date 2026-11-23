import { AuthError } from "alchemy/Auth/AuthProvider";
import { getEnv, getEnvRedacted } from "alchemy/Auth/Env";
import {
  makeStoredAuthProvider,
  storedSecret,
  storedValueText,
  type StoredAuthConfig,
} from "alchemy/Auth/StoredAuthProvider";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import { DEFAULT_API_BASE_URL } from "#telnyx/credentials.ts";

export const TELNYX_AUTH_PROVIDER_NAME = "Telnyx";

export { DEFAULT_API_BASE_URL };

export type TelnyxAuthConfig = StoredAuthConfig;

/** Resolved Telnyx credentials. */
export interface TelnyxResolvedCredentials {
  apiKey: Redacted.Redacted<string>;
  baseUrl: string;
  source: { type: TelnyxAuthConfig["method"] | "env"; details?: string };
}

const readEnvironment = Effect.gen(function* () {
  const apiKey = yield* getEnvRedacted("TELNYX_API_KEY");
  if (!apiKey) {
    return yield* AuthError.make({
      message: "Telnyx credentials not found. Set TELNYX_API_KEY.",
    });
  }
  const baseUrl =
    (yield* getEnv("TELNYX_API_BASE_URL")) ??
    (yield* getEnv("TELNYX_BASE_URL")) ??
    DEFAULT_API_BASE_URL;
  return { apiKey, baseUrl, source: { type: "env" as const } } satisfies TelnyxResolvedCredentials;
});

const telnyxAuth = makeStoredAuthProvider<TelnyxResolvedCredentials>({
  provider: TELNYX_AUTH_PROVIDER_NAME,
  fields: [
    { name: "apiKey", label: "Telnyx API v2 key", secret: true },
    {
      name: "baseUrl",
      label: "Telnyx API base URL",
      optional: true,
      placeholder: DEFAULT_API_BASE_URL,
    },
  ],
  toResolved: (values, source) => ({
    apiKey: storedSecret(values.apiKey) ?? Redacted.make(""),
    baseUrl: storedValueText(values.baseUrl) ?? DEFAULT_API_BASE_URL,
    source: { type: source },
  }),
  readEnvironment,
  environment: [
    {
      name: "TELNYX_API_KEY",
      required: true,
      secret: true,
      description: "Telnyx API v2 key (Portal → Auth → API Keys).",
    },
    {
      name: "TELNYX_API_BASE_URL",
      required: false,
      alternatives: ["TELNYX_BASE_URL"],
      description: "API base URL. Defaults to https://api.telnyx.com/v2.",
    },
  ],
});

/**
 * Layer that registers the Telnyx AuthProvider so `alchemy profile` can
 * configure it and stacks can resolve credentials from a profile.
 */
export const TelnyxAuth = telnyxAuth.layer;

/** Schema of Telnyx's inline static-token values. */
export const TelnyxStoredCredentials = telnyxAuth.storedSchema;
export type TelnyxStoredCredentials = typeof TelnyxStoredCredentials.Type;
