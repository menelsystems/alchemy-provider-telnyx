import * as Effect from "effect/Effect";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientResponse from "effect/http/HttpClientResponse";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as Credentials from "../../src/Credentials.ts";

export interface Call {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
  rawBody: Uint8Array | undefined;
  /** The request body kind: Uint8Array, FormData, Empty, … */
  bodyTag: string;
  /** Field names of a multipart body. */
  formFields: string[];
}

export type Reply = {
  status?: number;
  json?: unknown;
  text?: string;
  headers?: Record<string, string>;
};
export type Handler = (call: Call) => Reply | undefined;

/**
 * A fake Telnyx API: routes are matched in order by "METHOD /path" (path
 * without the /v2 prefix; `*` matches one segment). Every call is recorded.
 */
export const fakeTelnyx = (routes: Array<[string, Handler | Reply]>) => {
  const calls: Call[] = [];
  const http = HttpClient.make((request) =>
    Effect.sync(() => {
      const url = new URL(request.url);
      const bodyBytes =
        (request.body as { _tag: string; body?: Uint8Array })._tag === "Uint8Array"
          ? (request.body as unknown as { body: Uint8Array }).body
          : undefined;
      const text = bodyBytes ? new TextDecoder().decode(bodyBytes) : undefined;
      let body: unknown = text;
      try {
        body = text === undefined ? undefined : JSON.parse(text);
      } catch {}
      const call: Call = {
        method: request.method,
        path: url.pathname.replace(/^\/v2/, ""),
        query: Object.fromEntries(url.searchParams),
        headers: request.headers as Record<string, string>,
        body,
        rawBody: bodyBytes,
        bodyTag: (request.body as { _tag: string })._tag,
        formFields:
          (request.body as { _tag: string })._tag === "FormData"
            ? [...(request.body as unknown as { formData: FormData }).formData.keys()]
            : [],
      };
      calls.push(call);
      for (const [pattern, h] of routes) {
        const [m, p] = pattern.split(" ");
        const re = new RegExp(
          `^${p!.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]+")}$`,
        );
        if (m !== call.method || !re.test(call.path)) continue;
        const reply = typeof h === "function" ? h(call) : h;
        if (!reply) continue;
        const payload = reply.text ?? (reply.json === undefined ? "" : JSON.stringify(reply.json));
        return HttpClientResponse.fromWeb(
          request,
          new Response(reply.status === 204 ? null : payload, {
            status: reply.status ?? 200,
            headers: reply.headers,
          }),
        );
      }
      return HttpClientResponse.fromWeb(
        request,
        new Response(
          JSON.stringify({
            errors: [
              {
                code: "10005",
                title: "Resource not found",
                detail: `no route for ${call.method} ${call.path}`,
              },
            ],
          }),
          { status: 404 },
        ),
      );
    }),
  );
  const httpLayer = Layer.succeed(HttpClient.HttpClient, http);
  const credentials = Credentials.fromApiKey({ apiKey: Redacted.make("KEY_TEST") });
  const layer = Layer.mergeAll(credentials, httpLayer);
  return { calls, layer, httpLayer, credentials };
};
