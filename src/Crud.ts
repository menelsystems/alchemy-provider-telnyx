/**
 * The reconcile shape almost every Telnyx resource shares, written once on
 * alchemy's own primitives: `isResolved` for plan-time diffs,
 * `subsetDiffers` / `stableStringify` from `alchemy/Util` for comparisons,
 * and the typed `NotFound` the distilled SDK raises.
 *
 * A resource supplies typed SDK calls; this turns them into an alchemy
 * provider that follows the reconciler doctrine (observe → ensure → sync):
 *
 * - observe: `get` the live object; `NotFound` means it is missing
 * - ensure:  `create` it when missing
 * - sync:    send `update` with only the props that differ from the
 *            observed object; props removed since the last deploy are
 *            cleared with `null`
 */
import { isResolved } from "alchemy/Diff";
import * as Provider from "alchemy/Provider";
import type { ResourceClassLike, ResourceLike } from "alchemy/Resource";
import { subsetDiffers } from "alchemy/Util/equal";
import { stableStringify } from "alchemy/Util/stable";
import * as Effect from "effect/Effect";
import * as Predicate from "effect/Predicate";
import * as Redacted from "effect/Redacted";
import * as Schema from "effect/Schema";

/** A call needs an id (a path parameter) that neither the props nor the attributes hold. */
export class TelnyxMissingId extends Schema.TaggedError<TelnyxMissingId>()("TelnyxMissingId", {
  message: Schema.String,
}) {}

/** Reconcile found no object and the API has no create for this type. */
export class TelnyxCannotCreate extends Schema.TaggedError<TelnyxCannotCreate>()(
  "TelnyxCannotCreate",
  { message: Schema.String },
) {}

type Obj = Record<string, unknown>;

/** True for the SDK's typed 404. */
export const isNotFound = (e: unknown): boolean => Predicate.isTagged(e, "NotFound");

/** `undefined` instead of a 404. */
export const orUndefined = <A, E, R>(
  eff: Effect.Effect<A, E, R>,
): Effect.Effect<A | undefined, E, R> =>
  eff.pipe(Effect.catchIf(isNotFound, () => Effect.succeed(undefined)));

/** Deep copy with Redacted values unwrapped, for comparisons. */
const plain = (v: unknown): unknown => {
  if (Redacted.isRedacted(v)) return Redacted.value(v);
  if (Array.isArray(v)) return v.map(plain);
  if (v !== null && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as Obj).map(([k, x]) => [k, plain(x)]));
  }
  return v;
};

const same = (a: unknown, b: unknown) => stableStringify(plain(a)) === stableStringify(plain(b));

/** Props the user set that differ from the observed object. */
export const changedProps = <Props extends object>(
  props: Props,
  observed: object,
  olds: Partial<Props> | undefined,
  options: { readonly exclude?: ReadonlyArray<string>; readonly clearRemoved?: boolean } = {},
): Partial<Props> => {
  const delta: Obj = {};
  const exclude = new Set(options.exclude ?? []);
  for (const [k, v] of Object.entries(props)) {
    if (exclude.has(k) || v === undefined) continue;
    if (subsetDiffers(plain(v), plain((observed as Obj)[k]))) delta[k] = v;
  }
  if (options.clearRemoved !== false) {
    for (const k of Object.keys(olds ?? {})) {
      if (exclude.has(k) || (props as Obj)[k] !== undefined) continue;
      if ((olds as Obj)[k] !== undefined && (observed as Obj)[k] != null) delta[k] = null;
    }
  }
  return delta as Partial<Props>;
};

export interface CrudSpec<Props extends object, Attrs extends object, Lookup, E, R> {
  /** Props the API cannot change in place: a change replaces the object. */
  readonly replaceOn?: ReadonlyArray<keyof Props & string>;
  /**
   * Read the live object. `ref` merges the props and the last attributes, so
   * ids come from either. Return `undefined` when `ref` can't address one;
   * a `NotFound` also means it is gone.
   */
  readonly get: (ref: Partial<Props> & Partial<Attrs>) => Effect.Effect<Attrs | undefined, E, R>;
  /**
   * Reshape every object read back (get, list, lookup) before it becomes
   * attributes: copy a field the API echoes under another name, or fail with
   * `NotFound` for an object it only soft-deletes.
   */
  readonly normalize?: (obj: Attrs) => Effect.Effect<Attrs, E, R>;
  /** Create the object. Omit for objects that exist once per account (settings). */
  readonly create?: (props: Props) => Effect.Effect<Attrs, E, R>;
  /**
   * Converge the observed object to the props. `delta` holds the props that
   * differ from it (and `null` for props removed since the last deploy).
   * Return the new object, or nothing to re-read it with `get`.
   */
  readonly update?: (input: {
    readonly current: Attrs;
    readonly props: Props;
    readonly delta: Partial<Props>;
  }) => Effect.Effect<Attrs | void, E, R>;
  /** Delete the object. A `NotFound` is ignored. Omit when the API cannot delete it. */
  readonly delete?: (current: Attrs & Partial<Props>) => Effect.Effect<void, E, R>;
  /** Every object of this type in the account (for `alchemy nuke` and `provider.list`). */
  readonly list?: () => Effect.Effect<ReadonlyArray<Attrs>, E, R>;
  /** Find an object this stack doesn't manage. Defaults to `get`. */
  readonly lookup?: (key: Lookup) => Effect.Effect<Attrs | undefined, E, R>;
  /** Wait after create until the object is usable. */
  readonly wait?: (created: Attrs) => Effect.Effect<Attrs, E, R>;
  /** Check props before any call. */
  readonly validate?: (props: Props) => Effect.Effect<void, E, R>;
  /** Extra replacement rule (e.g. an uploaded file's content changed). */
  readonly replaceIf?: (input: {
    readonly news: Props;
    readonly olds: Props;
    readonly output: Attrs | undefined;
  }) => Effect.Effect<boolean, E, R>;
  /**
   * Destroy leaves the object in Telnyx when this returns a warning:
   * objects the API cannot delete, or ones (numbers, SIMs) kept unless
   * `releaseOnDestroy` is set.
   */
  readonly retain?: (props: Partial<Props>) => string | undefined;
  /**
   * Props the API never echoes back: settings only this provider reads (a
   * file path, \`release_on_destroy\`) and parent ids that are only path
   * parameters. They are never diffed against the live object or sent as
   * updates.
   */
  readonly local?: ReadonlyArray<string>;
  /** Attribute keys kept from the last output when a read omits or masks them. */
  readonly preserve?: ReadonlyArray<string>;
  /** Attributes that identify the object and never change in place. */
  readonly stables?: ReadonlyArray<keyof Attrs & string>;
}

const isMask = (v: unknown) => typeof v === "string" && v !== "" && v.replace(/\*/g, "") === "";

const keep = (
  fresh: Obj,
  previous: Obj | undefined,
  keys: ReadonlyArray<string> | undefined,
): Obj => {
  if (!previous || !keys?.length) return fresh;
  const out = { ...fresh };
  for (const k of keys)
    if ((out[k] === undefined || isMask(out[k])) && previous[k] !== undefined) out[k] = previous[k];
  return out;
};

/**
 * Build the alchemy provider for a resource from typed SDK calls.
 */
export const provider = <
  R extends ResourceLike,
  Props extends object = R["Props"],
  Attrs extends object = R["Attributes"],
  E = never,
  Req = never,
>(
  cls: ResourceClassLike<R>,
  spec: CrudSpec<Props, Attrs, R["Lookup"], E, Req>,
) =>
  Provider.effect(
    cls,
    Effect.gen(function* () {
      const normalize = (obj: Attrs | undefined) =>
        obj === undefined || !spec.normalize ? Effect.succeed(obj) : spec.normalize(obj);
      // Calls build their path from props/attributes with `path`, which
      // throws TelnyxMissingId; surface that as a typed failure, not a defect.
      const guard = <A, E2, R2>(f: () => Effect.Effect<A, E2, R2>) =>
        Effect.try({
          try: f,
          catch: (e) =>
            e instanceof TelnyxMissingId ? e : new TelnyxMissingId({ message: String(e) }),
        }).pipe(Effect.flatten);
      const observe = (ref: Obj) =>
        orUndefined(spec.get(ref as never).pipe(Effect.flatMap(normalize)));
      const service = {
        stables: (spec.stables ?? []) as any,
        diff: ({ news, olds, output }: any) =>
          Effect.gen(function* () {
            if (!isResolved(news)) return undefined;
            for (const k of spec.replaceOn ?? []) {
              if (!same(news[k], olds?.[k])) return { action: "replace" } as const;
            }
            if (spec.replaceIf && (yield* spec.replaceIf({ news, olds: olds ?? {}, output }))) {
              return { action: "replace" } as const;
            }
            return undefined;
          }),
        read: ({ olds, output }: any) =>
          Effect.gen(function* () {
            const live = yield* observe({ ...olds, ...output });
            return live === undefined ? undefined : keep(live as Obj, output, spec.preserve);
          }),
        reconcile: ({ news, olds, output }: any) =>
          Effect.gen(function* () {
            if (spec.validate) yield* spec.validate(news);
            // Observe — the output only caches ids; the object may be gone.
            let current = yield* observe({ ...output, ...news });
            let previous: Obj | undefined = output;
            // Ensure — create what is missing.
            if (current === undefined) {
              if (!spec.create) {
                return yield* new TelnyxCannotCreate({
                  message: `${cls.Type} does not exist and cannot be created through the Telnyx API`,
                });
              }
              let created = yield* guard(() => spec.create!(news));
              if (spec.wait) created = yield* spec.wait(created);
              // Re-read: some creates answer with a parent or a batch, not the
              // object itself. A read that can't see it yet keeps the response.
              current = keep(
                ((yield* observe({ ...news, ...(created as Obj) })) ?? created) as Obj,
                created as Obj,
                spec.preserve,
              ) as Attrs;
              previous = current as Obj;
              // Nothing was there before: there is nothing to clear.
              olds = undefined;
            }
            // Sync — send what still differs, after a create too: some
            // settings are only accepted by the update.
            if (!spec.update) return keep(current as Obj, previous, spec.preserve);
            // Props that force replacement are create-only: never sent as updates.
            const delta = changedProps(news, current, olds, {
              exclude: [...(spec.replaceOn ?? []), ...(spec.local ?? [])],
            });
            if (Object.keys(delta).length === 0)
              return keep(current as Obj, previous, spec.preserve);
            const updated = yield* guard(() =>
              spec.update!({ current: current!, props: news, delta }),
            );
            const fresh =
              updated ?? (yield* observe({ ...previous, ...(current as Obj), ...news }));
            return keep((fresh ?? current) as Obj, previous, spec.preserve);
          }),
        delete: ({ olds, output, force }: any) =>
          Effect.gen(function* () {
            const warning = spec.retain?.({
              ...olds,
              ...(force ? { releaseOnDestroy: true } : {}),
            });
            if (warning || !spec.delete) {
              yield* Effect.logWarning(
                `Object stays in Telnyx: ${warning ?? `the Telnyx API cannot delete a ${cls.Type}; it was removed from Alchemy state.`}`,
              );
              return;
            }
            yield* orUndefined(guard(() => spec.delete!({ ...olds, ...output })));
          }),
        lookup: (key: any) =>
          orUndefined(
            (spec.lookup ? spec.lookup(key) : spec.get(key)).pipe(Effect.flatMap(normalize)),
          ),
        ...(spec.list
          ? {
              list: () =>
                spec.list!().pipe(
                  Effect.flatMap((items) =>
                    Effect.forEach(items, (it) => orUndefined(normalize(it))),
                  ),
                  Effect.map((items) => items.filter((it) => it !== undefined)),
                ),
            }
          : {}),
        ...(!spec.delete || spec.retain ? { nuke: { skip: true } } : {}),
      };
      return service as any;
    }),
  ) as ReturnType<typeof Provider.effect<R, Req>>;

/**
 * The path parameters of a call, read from props/attributes. `map` is
 * `{ requestMember: refKey }`; `undefined` when any of them is not known yet.
 */
export const key = <const M extends Record<string, string>>(
  ref: object,
  map: M,
): { [K in keyof M]: string } | undefined => {
  const out: Record<string, string> = {};
  for (const [member, from] of Object.entries(map)) {
    const v = (ref as Obj)[from];
    if (v === undefined || v === null || v === "") return undefined;
    out[member] = Redacted.isRedacted(v) ? String(Redacted.value(v)) : String(v);
  }
  return out as { [K in keyof M]: string };
};

/**
 * Like {@link key}, for a call that must address an object: throws
 * {@link TelnyxMissingId} (surfaced by the provider as a typed failure)
 * rather than letting a request go out with an unfilled path.
 */
export const path = <const M extends Record<string, string>>(
  ref: object,
  map: M,
): { [K in keyof M]: string } => {
  const k = key(ref, map);
  if (k === undefined) {
    const missing = Object.values(map).filter(
      (from) => (ref as Obj)[from] == null || (ref as Obj)[from] === "",
    );
    throw new TelnyxMissingId({
      message: `cannot address the object: ${missing.join(", ")} is not known`,
    });
  }
  return k;
};

/** `props` without the keys only this provider reads (releaseOnDestroy, file paths, …). */
export const omit = <P extends object, K extends string>(
  props: P,
  keys: ReadonlyArray<K>,
): Omit<P, K> => {
  const out = { ...props } as Obj;
  for (const k of keys) delete out[k];
  return out as Omit<P, K>;
};

/** The `data` member of an enveloped response. */
export const data = <A>(res: { readonly data?: A | undefined | null }): A => res.data as A;

/** The only element of a `data` list (create operations that take a batch). */
export const first = <A>(res: { readonly data?: ReadonlyArray<A> | undefined | null }): A =>
  (res.data ?? [])[0] as A;
