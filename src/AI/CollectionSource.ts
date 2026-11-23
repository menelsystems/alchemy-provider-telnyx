// Telnyx collection source: telnyx_ai_collection_source in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ai_collections from "#telnyx/services/ai_collections.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link CollectionSource}: the create request of the Telnyx API.
 */
export type CollectionSourceProps = Omit<
  M_ai_collections.AddCollectionSourceRequest,
  "uuid" | "sourceId"
> & {
  /**
   * The collection id.
   */
  collection_id: string;
};

/**
 * Attributes of a deployed {@link CollectionSource}: the object as the Telnyx API returns it.
 */
export type CollectionSourceAttributes = NonNullable<
  M_ai_collections.SourceListEnvelope["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link CollectionSource} for `CollectionSource.lookup`.
 */
export interface CollectionSourceLookup {
  collection_id: string;
  id: string;
}

export type CollectionSource = Resource<
  "Telnyx.AI.CollectionSource",
  CollectionSourceProps,
  CollectionSourceAttributes,
  never,
  Providers,
  CollectionSourceLookup
>;

/**
 * A source that fills an AI knowledge collection, such as a storage bucket or the account's calls.
 *
 * Changing `bucket_id`, `collection_id`, `source_type` replaces it.
 *
 * @resource
 * @product AI
 */
export const CollectionSource = Resource<CollectionSource>("Telnyx.AI.CollectionSource");

export const CollectionSourceProvider = () =>
  Crud.provider(CollectionSource, {
    local: ["collection_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["bucket_id", "collection_id", "source_type"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { uuid: "collection_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(M_ai_collections.listCollectionSources, { ...parent } as any, "none").pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<CollectionSourceAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_ai_collections.addCollectionSource({
        ...props,
        ...Crud.path(props, { uuid: "collection_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<CollectionSourceAttributes, any, any>,
    delete: (current) =>
      M_ai_collections.removeCollectionSource({
        ...Crud.path(current, { uuid: "collection_id", sourceId: "id" }),
      } as any).pipe(Effect.asVoid),
  });
