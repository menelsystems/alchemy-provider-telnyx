// Telnyx kv key: telnyx_storage_kv_key in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import * as M_kv_keys from "../../vendor/distilled-telnyx/src/services/kv_keys.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link KVKey}: the create request of the Telnyx API.
 */
export type KVKeyProps = Omit<M_kv_keys.PutKvKeyRequest, "id" | "key" | "value"> & {
  /** The value, stored as UTF-8 text (at most 1 MiB). */
  value: string | Redacted.Redacted<string>;
  /**
   * The key.
   */
  key: string;
  /**
   * The namespace id.
   */
  namespace_id: string;
  /**
   * Seconds until the key expires and is removed. Sent when the value is written; by default the key never expires.
   */
  ttl_secs?: number;
};

/**
 * Attributes of a deployed {@link KVKey}: the object as the Telnyx API returns it.
 */
export type KVKeyAttributes = { value?: Redacted.Redacted<string> } & {
  key: string;
  namespace_id?: string;
};

/**
 * Identifies an existing {@link KVKey} for `KVKey.lookup`.
 */
export interface KVKeyLookup {
  namespace_id: string;
  key: string;
}

export type KVKey = Resource<
  "Telnyx.Storage.KVKey",
  KVKeyProps,
  KVKeyAttributes,
  never,
  Providers,
  KVKeyLookup
>;

/**
 * A key and its value in a KV namespace.
 *
 * Changing `key`, `namespace_id` replaces it.
 *
 * @resource
 * @product Storage
 */
export const KVKey = Resource<KVKey>("Telnyx.Storage.KVKey");

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const bytesOf = (value: string | Redacted.Redacted<string>) =>
  encoder.encode(Redacted.isRedacted(value) ? Redacted.value(value) : value);

export const KVKeyProvider = () =>
  Crud.provider(KVKey, {
    local: ["key", "namespace_id"],
    stables: ["key"] as any,
    replaceOn: ["key", "namespace_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "namespace_id", key: "key" });
      return k
        ? M_kv_keys.getKvKey(k).pipe(
            Effect.map((bytes) => ({ key: k.key, value: Redacted.make(decoder.decode(bytes)) })),
          )
        : Effect.succeed(undefined);
    },
    create: (props) =>
      // The value is the raw request body.
      M_kv_keys.putKvKey({
        ...Crud.path(props, { id: "namespace_id", key: "key" })!,
        value: bytesOf(props.value),
        ...(props.ttl_secs !== undefined ? { ttl_secs: props.ttl_secs } : {}),
      }).pipe(
        Effect.as({ key: props.key, value: Redacted.make(decoder.decode(bytesOf(props.value))) }),
      ),
    update: ({ props }) =>
      M_kv_keys.putKvKey({
        ...Crud.path(props, { id: "namespace_id", key: "key" })!,
        value: bytesOf(props.value),
        ...(props.ttl_secs !== undefined ? { ttl_secs: props.ttl_secs } : {}),
      }).pipe(
        Effect.as({ key: props.key, value: Redacted.make(decoder.decode(bytesOf(props.value))) }),
      ),
    delete: (current) =>
      M_kv_keys.deleteKvKey({
        ...Crud.path(current, { id: "namespace_id", key: "key" }),
      } as any).pipe(Effect.asVoid),
  });
