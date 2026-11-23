import { expect } from "@alchemy.run/test";
import * as Test from "@alchemy.run/test/Alchemy";
import * as Effect from "effect/Effect";
import * as MessagingApi from "#telnyx/services/messaging.ts";
import * as Telnyx from "../../src/index.ts";
import { fakeTelnyx } from "../unit/fake.ts";

// An in-memory Telnyx holding messaging profiles.
const profiles = new Map<string, Record<string, unknown>>();
let seq = 0;
const regenerated: string[] = [];
const idOf = (path: string) => path.split("/").pop()!;
const api = fakeTelnyx([
  [
    "POST /messaging_profiles",
    (c) => {
      const id = `mp_${++seq}`;
      profiles.set(id, { id, enabled: true, v1_secret: "s3cr3t", ...(c.body as object) });
      return { json: { data: profiles.get(id) } };
    },
  ],
  [
    "GET /messaging_profiles/*",
    (c) => {
      const p = profiles.get(idOf(c.path));
      return p
        ? { json: { data: p } }
        : { status: 404, json: { errors: [{ code: "10005", title: "Not found" }] } };
    },
  ],
  [
    "PATCH /messaging_profiles/*",
    (c) => {
      const id = idOf(c.path);
      profiles.set(id, { ...profiles.get(id), ...(c.body as object) });
      return { json: { data: profiles.get(id) } };
    },
  ],
  [
    "POST /messaging_profiles/*/actions/regenerate_secret",
    (c) => {
      const id = c.path.split("/")[2]!;
      regenerated.push(id);
      return { json: { data: { ...profiles.get(id), v1_secret: "rotated" } } };
    },
  ],
  [
    "DELETE /messaging_profiles/*",
    (c) => {
      const p = profiles.get(idOf(c.path));
      profiles.delete(idOf(c.path));
      return p ? { json: { data: p } } : { status: 404, json: { errors: [{ code: "10005" }] } };
    },
  ],
]);

const { test } = Test.make({
  providers: Telnyx.providers({ httpClient: api.httpLayer, credentials: api.credentials }),
});

const program = (name: string, webhook?: string) =>
  Effect.gen(function* () {
    const profile = yield* Telnyx.Messaging.Profile("Alerts", {
      name,
      whitelisted_destinations: ["US", "CA"],
      ...(webhook ? { webhook_url: webhook } : {}),
    });
    // A one-shot API call during deploy, wired to the profile's id.
    yield* Telnyx.Call("RotateSecret", MessagingApi.regenerateMessagingProfileSecret2, {
      id: profile.id,
    });
    return { id: profile.id, name: profile.name };
  });

test.provider(
  "deploy, update in place, clear a removed prop, and destroy",
  (stack) =>
    Effect.gen(function* () {
      yield* stack.destroy();

      const v1 = yield* stack.deploy(program("alerts", "https://a.example/hook"));
      expect(v1.name).toBe("alerts");
      expect(profiles.get(v1.id as string)?.whitelisted_destinations).toEqual(["US", "CA"]);
      expect(regenerated).toEqual([v1.id]);

      const before = api.calls.length;
      const v2 = yield* stack.deploy(program("alerts-renamed"));
      expect(v2.id).toBe(v1.id);
      const patches = api.calls.slice(before).filter((c) => c.method === "PATCH");
      // Only what differs from the live object, plus an explicit clear.
      expect(patches.map((c) => c.body)).toEqual([{ name: "alerts-renamed", webhook_url: null }]);

      yield* stack.destroy();
      expect(profiles.size).toBe(0);
    }),
  { timeout: 60_000 },
);
