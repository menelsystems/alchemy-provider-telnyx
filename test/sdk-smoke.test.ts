import { expect, test } from "bun:test";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as Sdk from "#telnyx/index.ts";
import * as Profiles from "#telnyx/services/profiles.ts";
import { fakeTelnyx } from "./unit/fake.ts";

test("vendored SDK round-trips through the fake API", async () => {
  const api = fakeTelnyx([
    [
      "GET /messaging_profiles/missing",
      { status: 404, json: { errors: [{ code: "10005", title: "Not found", detail: "gone" }] } },
    ],
    [
      "GET /messaging_profiles/*",
      { json: { data: { id: "mp_1", name: "alerts", v1_secret: "s" } } },
    ],
    [
      "PATCH /messaging_profiles/*",
      (c) => ({ json: { data: { id: "mp_1", ...(c.body as object) } } }),
    ],
  ]);
  const layer = Layer.mergeAll(api.httpLayer, Sdk.fromApiKey({ apiKey: Redacted.make("KEY") }));
  const out = await Effect.runPromise(
    Effect.gen(function* () {
      const got = yield* Profiles.getMessagingProfile({ id: "mp_1" });
      const upd = yield* Profiles.updateMessagingProfile({
        id: "mp_1",
        name: "b",
        webhook_url: null,
      });
      const miss = yield* Profiles.getMessagingProfile({ id: "missing" }).pipe(Effect.flip);
      return { got, upd, miss };
    }).pipe(Effect.provide(layer)),
  );
  expect(out.got.data?.name).toBe("alerts");
  expect(Redacted.isRedacted(out.got.data?.v1_secret)).toBe(true);
  expect(api.calls[1]!.body).toEqual({ name: "b", webhook_url: null });
  expect(out.miss._tag).toBe("NotFound");
  expect((out.miss as any).message).toContain("[10005] gone");
  expect(api.calls[0]!.headers.authorization).toBe("Bearer KEY");
});
