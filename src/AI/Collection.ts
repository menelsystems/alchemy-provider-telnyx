// Telnyx collection: telnyx_ai_collection in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ai_collections from "../../vendor/distilled-telnyx/src/services/ai_collections.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Collection}: the create request and the update request of the Telnyx API.
 */
export type CollectionProps = Omit<M_ai_collections.CreateCollectionRequest, "uuid"> &
  Partial<Omit<M_ai_collections.UpdateCollectionRequest, "uuid">> &
  Partial<Omit<M_ai_collections.UpdateCollectionSettingsRequest, "uuid">>;

/**
 * Attributes of a deployed {@link Collection}: the object as the Telnyx API returns it.
 */
export type CollectionAttributes = NonNullable<M_ai_collections.CollectionEnvelope["data"]> & {
  uuid: string;
};

/**
 * Identifies an existing {@link Collection} for `Collection.lookup`.
 */
export interface CollectionLookup {
  uuid: string;
}

export type Collection = Resource<
  "Telnyx.AI.Collection",
  CollectionProps,
  CollectionAttributes,
  never,
  Providers,
  CollectionLookup
>;

/**
 * A knowledge collection that AI assistants search, filled from storage buckets, calls, meetings and messages.
 *
 * Changing `slug`, `sources` replaces it.
 *
 * @resource
 * @product AI
 */
export const Collection = Resource<Collection>("Telnyx.AI.Collection");

export const CollectionProvider = () =>
  Crud.provider(Collection, {
    local: ["uuid"],
    stables: ["uuid"] as any,
    replaceOn: ["slug", "sources"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { uuid: "uuid" });
      return k
        ? (M_ai_collections.getCollection(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            CollectionAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ai_collections.createCollection({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<CollectionAttributes, any, any>,
    // Retrieval settings change through their own endpoint.
    update: ({ current, delta }) =>
      Effect.gen(function* () {
        const { retrieval, ...rest } = delta;
        if (Object.keys(rest).length > 0) {
          yield* M_ai_collections.updateCollection({ ...rest, uuid: current.uuid } as any);
        }
        if (retrieval !== undefined) {
          yield* M_ai_collections.updateCollectionSettings({
            uuid: current.uuid,
            retrieval: retrieval ?? undefined,
          });
        }
      }),
    delete: (current) =>
      M_ai_collections.deleteCollection({ ...Crud.path(current, { uuid: "uuid" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_ai_collections.listCollections, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    normalize: (obj) =>
      // Retrieval settings are sent as retrieval but read back inside settings.
      Effect.succeed(Hooks.withField(obj, "retrieval", (obj as any).settings?.retrieval)),
  });
