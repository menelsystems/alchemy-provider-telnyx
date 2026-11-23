import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as BunServices from "@effect/platform-bun/BunServices";
import * as Provider from "alchemy/Provider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as Profiles from "#telnyx/services/profiles.ts";
import * as Crud from "../../src/Crud.ts";
import * as Telnyx from "../../src/index.ts";
import * as Paging from "../../src/Paging.ts";
import { fakeTelnyx, type Reply } from "./fake.ts";

type Api = ReturnType<typeof fakeTelnyx>;

/** Run `eff` against the fake API, with the provider layer of one resource. */
const run = <A>(
  api: Api,
  eff: Effect.Effect<A, any, any>,
  providerLayer?: Layer.Layer<any, any, any>,
) =>
  Effect.runPromise(
    (providerLayer ? eff.pipe(Effect.provide(providerLayer)) : eff).pipe(
      Effect.provide(Layer.mergeAll(api.layer, BunServices.layer)),
    ) as Effect.Effect<A>,
  );

const providerOf = (cls: { Type: string }) => Provider.Provider(cls.Type as any) as any;
const ctx = { id: "x", fqn: "x", instanceId: "i", session: {}, bindings: [] };
const notFound: Reply = {
  status: 404,
  json: { errors: [{ code: "10005", title: "Resource not found" }] },
};
const last = (path: string) => path.split("/").pop()!;

describe("Crud.changedProps", () => {
  test("sends only what differs from the observed object, and clears removed props", () => {
    const delta = Crud.changedProps<Record<string, unknown>>(
      { name: "b", enabled: true, tags: ["x"], nested: { a: 1 } },
      {
        name: "a",
        enabled: true,
        tags: ["x"],
        nested: { a: 1, server_default: 2 },
        webhook_url: "https://w",
      },
      { name: "a", webhook_url: "https://w" },
    );
    expect(delta).toEqual({ name: "b", webhook_url: null });
  });

  test("compares secrets by value", () => {
    const delta = Crud.changedProps(
      { token: Redacted.make("s") },
      { token: Redacted.make("s") },
      undefined,
    );
    expect(delta).toEqual({});
  });
});

describe("Messaging.Profile", () => {
  const routes = (store: Map<string, Record<string, unknown>>) => [
    [
      "POST /messaging_profiles",
      (c: any) => {
        const p = { id: "mp_1", enabled: true, ...c.body };
        store.set(p.id, p);
        return { json: { data: p } };
      },
    ] as const,
    [
      "GET /messaging_profiles/*",
      (c: any) =>
        store.has(last(c.path)) ? { json: { data: store.get(last(c.path)) } } : notFound,
    ] as const,
    [
      "PATCH /messaging_profiles/*",
      (c: any) => {
        const p = { ...store.get(last(c.path)), ...c.body };
        store.set(last(c.path), p);
        return { json: { data: p } };
      },
    ] as const,
    [
      "DELETE /messaging_profiles/*",
      (c: any) => (store.delete(last(c.path)) ? { json: {} } : notFound),
    ] as const,
  ];

  test("create, then nothing to sync", async () => {
    const store = new Map();
    const api = fakeTelnyx(routes(store) as any);
    const attrs = await run(
      api,
      Effect.gen(function* () {
        const p = yield* providerOf(Telnyx.Messaging.Profile);
        return yield* p.reconcile({
          ...ctx,
          news: { name: "a", whitelisted_destinations: ["US"] },
        });
      }),
      Telnyx.Messaging.ProfileProvider(),
    );
    expect(api.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      "POST /messaging_profiles",
      "GET /messaging_profiles/mp_1",
    ]);
    expect(api.calls[0]!.body).toEqual({ name: "a", whitelisted_destinations: ["US"] });
    expect(attrs.id).toBe("mp_1");
  });

  test("recreates an object deleted out-of-band", async () => {
    const store = new Map();
    const api = fakeTelnyx(routes(store) as any);
    await run(
      api,
      Effect.gen(function* () {
        const p = yield* providerOf(Telnyx.Messaging.Profile);
        return yield* p.reconcile({
          ...ctx,
          news: { name: "a", whitelisted_destinations: [] },
          olds: { name: "a", whitelisted_destinations: [] },
          output: { id: "gone" },
        });
      }),
      Telnyx.Messaging.ProfileProvider(),
    );
    expect(api.calls.map((c) => c.method)).toEqual(["GET", "POST", "GET"]);
  });

  test("read returns undefined on 404; delete ignores it", async () => {
    const api = fakeTelnyx(routes(new Map()) as any);
    const read = await run(
      api,
      Effect.gen(function* () {
        const p = yield* providerOf(Telnyx.Messaging.Profile);
        yield* p.delete({ ...ctx, olds: {}, output: { id: "mp_1" } });
        return yield* p.read({ ...ctx, olds: {}, output: { id: "mp_1" } });
      }),
      Telnyx.Messaging.ProfileProvider(),
    );
    expect(read).toBeUndefined();
  });

  test("lookup finds an unmanaged object", async () => {
    const store = new Map([["mp_9", { id: "mp_9", name: "theirs" }]]);
    const api = fakeTelnyx(routes(store) as any);
    const found = await run(
      api,
      Effect.gen(function* () {
        return yield* (yield* providerOf(Telnyx.Messaging.Profile)).lookup({ id: "mp_9" });
      }),
      Telnyx.Messaging.ProfileProvider(),
    );
    expect(found.name).toBe("theirs");
  });
});

describe("diff", () => {
  test("a create-only prop change replaces; an updatable one defers to the engine", async () => {
    const api = fakeTelnyx([]);
    const [replace, update] = await run(
      api,
      Effect.gen(function* () {
        const p = yield* providerOf(Telnyx.Account.AccessIPRange);
        const q = yield* providerOf(Telnyx.Messaging.Profile);
        return [
          yield* p.diff({
            ...ctx,
            news: { cidr_block: "10.0.0.0/8" },
            olds: { cidr_block: "10.0.0.0/16" },
          }),
          yield* q.diff({ ...ctx, news: { name: "b" }, olds: { name: "a" } }),
        ];
      }),
      Layer.mergeAll(Telnyx.Account.AccessIPRangeProvider(), Telnyx.Messaging.ProfileProvider()),
    );
    expect(replace).toEqual({ action: "replace" });
    expect(update).toBeUndefined();
  });
});

describe("Paging", () => {
  const page = (n: number, total: number, ids: string[]): Reply => ({
    json: {
      data: ids.map((id) => ({ id, name: id })),
      meta: { page_number: n, total_pages: total },
    },
  });

  test("walks page[number] until total_pages", async () => {
    const api = fakeTelnyx([
      [
        "GET /messaging_profiles",
        (c) => (c.query["page[number]"] === "1" ? page(1, 2, ["a", "b"]) : page(2, 2, ["c"])),
      ],
    ]);
    const items = await run(api, Paging.all(Profiles.listMessagingProfiles, { filter_name_: "x" }));
    expect(items.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(api.calls[0]!.query["page[size]"]).toBe("250");
    expect(api.calls[0]!.query["filter[name]"]).toBe("x");
  });

  test("stops at maxItems", async () => {
    const api = fakeTelnyx([["GET /messaging_profiles", () => page(1, 9, ["a", "b"])]]);
    const items = await run(api, Paging.all(Profiles.listMessagingProfiles, {}, "page-flat", 1));
    expect(items).toHaveLength(1);
    expect(api.calls).toHaveLength(1);
  });

  test("finds a resource that has no item read in its collection", async () => {
    const api = fakeTelnyx([
      [
        "GET /access_ip_ranges",
        (c) =>
          c.query["page[number]"] === "1"
            ? {
                json: { data: [{ id: "r1", cidr_block: "10.1.0.0/16" }], meta: { total_pages: 2 } },
              }
            : {
                json: { data: [{ id: "r2", cidr_block: "10.2.0.0/16" }], meta: { total_pages: 2 } },
              },
      ],
    ]);
    const got = await run(
      api,
      Effect.gen(function* () {
        return yield* (yield* providerOf(Telnyx.Account.AccessIPRange)).read({
          ...ctx,
          olds: {},
          output: { id: "r2" },
        });
      }),
      Telnyx.Account.AccessIPRangeProvider(),
    );
    expect(got.cidr_block).toBe("10.2.0.0/16");
  });
});

describe("special cases", () => {
  test("KV key: the value is the raw body, ttl a query param, and reads come back redacted", async () => {
    let stored: Uint8Array | undefined;
    const api = fakeTelnyx([
      ["PUT /storage/kvs/*/keys/*", (c) => ((stored = c.rawBody), { status: 200, text: "" })],
      [
        "GET /storage/kvs/*/keys/*",
        () =>
          stored
            ? {
                text: new TextDecoder().decode(stored),
                headers: { "content-type": "application/octet-stream" },
              }
            : notFound,
      ],
    ]);
    const attrs = await run(
      api,
      Effect.gen(function* () {
        const p = yield* providerOf(Telnyx.Storage.KVKey);
        return yield* p.reconcile({
          ...ctx,
          news: {
            namespace_id: "ns1",
            key: "greeting",
            value: Redacted.make("hello"),
            ttl_secs: 60,
          },
        });
      }),
      Telnyx.Storage.KVKeyProvider(),
    );
    const put = api.calls.find((c) => c.method === "PUT")!;
    expect(put.path).toBe("/storage/kvs/ns1/keys/greeting");
    expect(put.query.ttl_secs).toBe("60");
    expect(new TextDecoder().decode(put.rawBody)).toBe("hello");
    expect(Redacted.value(attrs.value)).toBe("hello");
  });

  test("DIR phone number: one number sent as a batch of one", async () => {
    const api = fakeTelnyx([
      [
        "POST /dir/*/phone_numbers",
        (c) => ({
          json: { data: [{ id: "pn1", phone_number: (c.body as any).phone_numbers[0] }] },
        }),
      ],
      [
        "GET /dir/*/phone_numbers",
        () => ({
          json: { data: [{ id: "pn1", phone_number: "+13125550100" }], meta: { total_pages: 1 } },
        }),
      ],
      ["DELETE /dir/*/phone_numbers", { json: {} }],
    ]);
    await run(
      api,
      Effect.gen(function* () {
        const p = yield* providerOf(Telnyx.Compliance.DisplayIdentityRecordPhoneNumber);
        yield* p.reconcile({ ...ctx, news: { dir_id: "d1", phone_number: "+13125550100" } });
        yield* p.delete({
          ...ctx,
          olds: { dir_id: "d1", phone_number: "+13125550100" },
          output: { id: "pn1", phone_number: "+13125550100" },
        });
      }),
      Telnyx.Compliance.DisplayIdentityRecordPhoneNumberProvider(),
    );
    expect(api.calls[0]!.body).toEqual({ phone_numbers: ["+13125550100"] });
    expect(api.calls.at(-1)!.body).toEqual({ phone_numbers: ["+13125550100"] });
  });

  test("a soft-deleted dedicated IP reads as gone", async () => {
    const api = fakeTelnyx([
      ["GET /email/dedicated_ips/*", { json: { data: { id: "ip1", status: "released" } } }],
    ]);
    const read = await run(
      api,
      Effect.gen(function* () {
        return yield* (yield* providerOf(Telnyx.Email.DedicatedIP)).read({
          ...ctx,
          olds: {},
          output: { id: "ip1" },
        });
      }),
      Telnyx.Email.DedicatedIPProvider(),
    );
    expect(read).toBeUndefined();
  });

  test("phone numbers stay in the account on destroy unless release_on_destroy", async () => {
    const api = fakeTelnyx([["DELETE /phone_numbers/*", { json: { data: {} } }]]);
    await run(
      api,
      Effect.gen(function* () {
        const p = yield* providerOf(Telnyx.Numbers.PhoneNumber);
        yield* p.delete({ ...ctx, olds: { phone_number_id: "n1" }, output: { id: "n1" } });
        yield* p.delete({
          ...ctx,
          olds: { phone_number_id: "n2", release_on_destroy: true },
          output: { id: "n2" },
        });
      }),
      Telnyx.Numbers.PhoneNumberProvider(),
    );
    expect(api.calls.map((c) => c.path)).toEqual(["/phone_numbers/n2"]);
  });

  test("a call that can't address its object fails instead of sending a request", async () => {
    const api = fakeTelnyx([]);
    const err = await run(
      api,
      Effect.gen(function* () {
        const p = yield* providerOf(Telnyx.Messaging.Profile);
        return yield* p.delete({ ...ctx, olds: {}, output: {} }).pipe(Effect.flip);
      }),
      Telnyx.Messaging.ProfileProvider(),
    );
    expect(err._tag).toBe("TelnyxMissingId");
    expect(api.calls).toHaveLength(0);
  });

  test("avatar: uploads the image as multipart and replaces when its content changes", async () => {
    const dir = mkdtempSync(join(tmpdir(), "avatar-"));
    const img = join(dir, "me.png");
    writeFileSync(img, "png-bytes-1");
    const api = fakeTelnyx([
      ["POST /ai/avatars", { json: { data: { id: "av1", name: "me" } } }],
      ["GET /ai/avatars/*", { json: { data: { id: "av1", name: "me" } } }],
    ]);
    const { attrs, same, changed } = await run(
      api,
      Effect.gen(function* () {
        const p = yield* providerOf(Telnyx.AI.Avatar);
        const attrs = yield* p.reconcile({ ...ctx, news: { name: "me", image_path: img } });
        const same = yield* p.diff({
          ...ctx,
          news: { name: "me", image_path: img },
          olds: { name: "me", image_path: img },
          output: attrs,
        });
        writeFileSync(img, "png-bytes-2");
        const changed = yield* p.diff({
          ...ctx,
          news: { name: "me", image_path: img },
          olds: { name: "me", image_path: img },
          output: attrs,
        });
        return { attrs, same, changed };
      }),
      Telnyx.AI.AvatarProvider(),
    );
    expect(api.calls[0]!.bodyTag).toBe("FormData");
    expect(api.calls[0]!.formFields.sort()).toEqual(["image_file", "name"]);
    expect(attrs.image_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(same).toBeUndefined();
    expect(changed).toEqual({ action: "replace" });
  });
});
