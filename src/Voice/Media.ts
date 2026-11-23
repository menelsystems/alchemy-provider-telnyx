// Telnyx media: telnyx_media in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_media_storage_api from "#telnyx/services/media_storage_api.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Media}: the create request and the update request of the Telnyx API.
 */
export type MediaProps = Omit<M_media_storage_api.CreateMediaStorageRequest, "media_name"> &
  Partial<Omit<M_media_storage_api.UpdateMediaStorageRequest, "media_name">> & {
    /**
     * Uniquely identifies a media resource.
     */
    media_name: string;
  };

/**
 * Attributes of a deployed {@link Media}: the object as the Telnyx API returns it.
 */
export type MediaAttributes = NonNullable<M_media_storage_api.GetMediaStorageResponse["data"]> & {
  media_name: string;
};

/**
 * Identifies an existing {@link Media} for `Media.lookup`.
 */
export interface MediaLookup {
  media_name: string;
}

export type Media = Resource<
  "Telnyx.Voice.Media",
  MediaProps,
  MediaAttributes,
  never,
  Providers,
  MediaLookup
>;

/**
 * A media file stored by Telnyx for use in calls and messages, fetched from a URL.
 *
 * Changing `media_name` replaces it.
 *
 * @resource
 * @product Voice
 */
export const Media = Resource<Media>("Telnyx.Voice.Media");

export const MediaProvider = () =>
  Crud.provider(Media, {
    local: ["media_name"],
    stables: ["media_name"] as any,
    replaceOn: ["media_name"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { media_name: "media_name" });
      return k
        ? (M_media_storage_api.getMediaStorage(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<MediaAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_media_storage_api.createMediaStorage({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<MediaAttributes, any, any>,
    update: ({ current, props }) =>
      M_media_storage_api.updateMediaStorage({
        ...props,
        ...Crud.path({ ...props, ...current }, { media_name: "media_name" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<MediaAttributes, any, any>,
    delete: (current) =>
      M_media_storage_api.deleteMediaStorage({
        ...Crud.path(current, { media_name: "media_name" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_media_storage_api.listMediaStorage, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
  });
