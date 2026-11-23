/**
 * Telnyx credentials for the vendored distilled SDK, resolved through
 * Alchemy's AuthProvider (environment first, then the selected profile).
 */
import type { ConfigError } from "@distilled.cloud/core/errors";
import { lazyCredentials } from "alchemy/Auth/Resolve";
import * as Layer from "effect/Layer";
import { Credentials } from "../vendor/distilled-telnyx/src/credentials.ts";
import { TELNYX_AUTH_PROVIDER_NAME, type TelnyxResolvedCredentials } from "./AuthProvider.ts";

export {
  Credentials,
  CredentialsFromEnv,
  DEFAULT_API_BASE_URL,
  fromApiKey,
  type Config,
} from "../vendor/distilled-telnyx/src/credentials.ts";

// Lets the SDK credentials bubble through a stack's `providers` layer, so
// stack code and Actions can call SDK operations directly.
declare module "../vendor/distilled-telnyx/src/credentials.ts" {
  interface Credentials {
    readonly kind: "Credentials";
  }
}

/** Credentials from the Alchemy AuthProvider: `TELNYX_API_KEY`, else the selected profile. */
export const fromAuthProvider = () =>
  Layer.effect(
    Credentials,
    lazyCredentials<TelnyxResolvedCredentials, ConfigError>()(
      TELNYX_AUTH_PROVIDER_NAME,
      (creds) => ({
        apiKey: creds.apiKey,
        apiBaseUrl: creds.baseUrl,
      }),
    ),
  );
