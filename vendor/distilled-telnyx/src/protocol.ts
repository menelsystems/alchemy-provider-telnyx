import type * as API from "@distilled.cloud/core/api";
import type { API_ERRORS, ConfigError, InvalidInput } from "@distilled.cloud/core/errors";
import { makeRestProtocol, unknownErrorProps } from "@distilled.cloud/core/protocol-rest";
import type { SdkError } from "@distilled.cloud/core/sdk-error";
/**
 * TelnyxProtocol -- hand-written.
 *
 * Telnyx speaks bearer-authenticated JSON REST:
 *
 *   request:  credentials -> `Authorization: Bearer <apiKey>` + base URL
 *             (default https://api.telnyx.com/v2), resolved from the
 *             calling fiber on every request
 *
 *   response: 2xx JSON is the payload as the spec models it (most
 *             responses carry their object in a `data` member); non-2xx
 *             `{ errors: [{ code, title, detail }] }` bodies map to the
 *             operation's typed error classes by status, then the shared
 *             HTTP-status classes, then {@link UnknownTelnyxError}.
 */
import * as Effect from "effect/Effect";
import type * as HttpClient from "effect/http/HttpClient";
import type * as HttpClientError from "effect/http/HttpClientError";
import type * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { Credentials, type Config } from "./credentials.ts";
import { UnknownTelnyxError, TelnyxParseError } from "./errors.ts";

/** Error channel shared by every generated Telnyx operation. */
export type TelnyxOpError =
  | InstanceType<(typeof API_ERRORS)[number]>
  | UnknownTelnyxError
  | ConfigError
  | HttpClientError.HttpClientError
  | TelnyxParseError
  | InvalidInput
  | SdkError;

/** Context (requirements) shared by every generated Telnyx operation. */
export type TelnyxOpContext = Credentials | HttpClient.HttpClient;

export const TelnyxProtocol: Layer.Layer<API.Protocol> = /*@__PURE__*/ makeRestProtocol<Config>({
  credentials: /*@__PURE__*/ Effect.flatMap(Credentials, (resolve) => resolve),
  baseUrl: (creds) => creds.apiBaseUrl,
  headers: (creds) => ({
    Authorization: `Bearer ${Redacted.value(creds.apiKey)}`,
  }),
  // `{ errors: [{ code, title, detail }] }`: the first entry's code, and
  // every entry's detail (or title) as the message.
  errorEnvelope: (body) => {
    const errors = (body as { errors?: unknown } | null)?.errors;
    if (!Array.isArray(errors) || errors.length === 0) return undefined;
    const first = errors[0] as { code?: unknown };
    const code =
      typeof first?.code === "string" || typeof first?.code === "number" ? first.code : undefined;
    const message = errors
      .map((e: { code?: unknown; title?: unknown; detail?: unknown }) => {
        const text =
          typeof e?.detail === "string" ? e.detail : typeof e?.title === "string" ? e.title : "";
        return e?.code !== undefined ? `[${String(e.code)}] ${text}` : text;
      })
      .join("; ");
    return { code, message };
  },
  unknownError: (info) => new UnknownTelnyxError(unknownErrorProps(info)),
  parseError: ({ body, cause }) => new TelnyxParseError({ body, cause }),
});
