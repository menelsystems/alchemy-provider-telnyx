// Telnyx kv namespace: telnyx_storage_kv_namespace in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_kv_namespaces from "../../vendor/distilled-telnyx/src/services/kv_namespaces.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link KVNamespace}: the create request of the Telnyx API.
 */
export type KVNamespaceProps = Omit<M_kv_namespaces.CreateKvNamespaceRequest, "id">;

/**
 * Attributes of a deployed {@link KVNamespace}: the object as the Telnyx API returns it.
 */
export type KVNamespaceAttributes = NonNullable<
  M_kv_namespaces.KvNamespaceResponseWrapper["data"]
> & { id: string };

/**
 * Identifies an existing {@link KVNamespace} for `KVNamespace.lookup`.
 */
export interface KVNamespaceLookup {
  id: string;
}

export type KVNamespace = Resource<
  "Telnyx.Storage.KVNamespace",
  KVNamespaceProps,
  KVNamespaceAttributes,
  never,
  Providers,
  KVNamespaceLookup
>;

/**
 * A KV namespace, a key-value store in Telnyx Storage.
 *
 * Changing `name` replaces it.
 *
 * @resource
 * @product Storage
 */
export const KVNamespace = Resource<KVNamespace>("Telnyx.Storage.KVNamespace");

export const KVNamespaceProvider = () =>
  Crud.provider(KVNamespace, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["name"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_kv_namespaces.getKvNamespace(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            KVNamespaceAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_kv_namespaces.createKvNamespace({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<KVNamespaceAttributes, any, any>,
    delete: (current) =>
      M_kv_namespaces.deleteKvNamespace({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_kv_namespaces.listKvNamespaces, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    wait: (created) =>
      // Provisioned asynchronously: keys and queries answer 409 until provision_ok.
      Hooks.waitForStatus(
        M_kv_namespaces.getKvNamespace({ id: created.id } as any).pipe(Effect.map(Crud.data)),
        {
          ready: ["provision_ok", ""],
          failed: ["provision_failed", "deleting", "delete_failed"],
          what: `KVNamespace ${created.id}`,
          every: "2 seconds",
        },
      ) as Effect.Effect<KVNamespaceAttributes, any, any>,
  });
