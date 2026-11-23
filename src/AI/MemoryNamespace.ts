// Telnyx memory namespace: telnyx_ai_memory_namespace in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_namespaces from "../../vendor/distilled-telnyx/src/services/namespaces.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link MemoryNamespace}: the create request of the Telnyx API.
 */
export type MemoryNamespaceProps = Omit<M_namespaces.CreateNamespaceRequest, "namespace">;

/**
 * Attributes of a deployed {@link MemoryNamespace}: the object as the Telnyx API returns it.
 */
export type MemoryNamespaceAttributes = NonNullable<
  M_namespaces.NamespaceListResponse["data"]
>[number] & { name: string };

/**
 * Identifies an existing {@link MemoryNamespace} for `MemoryNamespace.lookup`.
 */
export interface MemoryNamespaceLookup {
  name: string;
}

export type MemoryNamespace = Resource<
  "Telnyx.AI.MemoryNamespace",
  MemoryNamespaceProps,
  MemoryNamespaceAttributes,
  never,
  Providers,
  MemoryNamespaceLookup
>;

/**
 * A memory namespace, where AI assistants keep what they remember about the people they talk to.
 *
 * Changing `name` replaces it.
 *
 * @resource
 * @product AI
 */
export const MemoryNamespace = Resource<MemoryNamespace>("Telnyx.AI.MemoryNamespace");

export const MemoryNamespaceProvider = () =>
  Crud.provider(MemoryNamespace, {
    local: ["name"],
    stables: ["name"] as any,
    replaceOn: ["name"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "name" });
      const parent = Crud.key(ref, {});
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(M_namespaces.listNamespaces, { ...parent } as any, "none").pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["name"]) === id.id)),
      ) as Effect.Effect<MemoryNamespaceAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_namespaces.createNamespace({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<MemoryNamespaceAttributes, any, any>,
    delete: (current) =>
      M_namespaces.deleteNamespace({ ...Crud.path(current, { namespace: "name" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_namespaces.listNamespaces, {} as any, "none") as Effect.Effect<any, any, any>,
  });
