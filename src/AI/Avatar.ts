// Telnyx avatar: telnyx_ai_avatar in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_avatars from "../../vendor/distilled-telnyx/src/services/avatars.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Avatar}: the create request and the update request of the Telnyx API.
 */
export type AvatarProps = Omit<
  M_avatars.CreateAvatarPublicAvatarsPostRequest,
  "avatar_id" | "image_file"
> &
  Partial<Omit<M_avatars.UpdateAvatarPublicAvatarsAvatarIdPatchRequest, "avatar_id">> & {
    /**
     * Path to a JPEG, PNG or WebP image of at most 10 MiB, uploaded when the avatar is created. A file with different content creates a new avatar.
     */
    image_path: string;
  };

/**
 * Attributes of a deployed {@link Avatar}: the object as the Telnyx API returns it.
 */
export type AvatarAttributes = NonNullable<M_avatars.AvatarResponse["data"]> & {
  id: string;
  /** SHA-256 of the uploaded image. A file with different content replaces the avatar. */
  image_sha256?: string;
};

/**
 * Identifies an existing {@link Avatar} for `Avatar.lookup`.
 */
export interface AvatarLookup {
  id: string;
}

export type Avatar = Resource<
  "Telnyx.AI.Avatar",
  AvatarProps,
  AvatarAttributes,
  never,
  Providers,
  AvatarLookup
>;

/**
 * An avatar image for AI assistants in realtime browser conversations.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 *
 * @resource
 * @product AI
 */
export const Avatar = Resource<Avatar>("Telnyx.AI.Avatar");

const IMAGE_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export const AvatarProvider = () =>
  Crud.provider(Avatar, {
    local: ["id", "image_path"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { avatar_id: "id" });
      return k
        ? (M_avatars.getAvatarPublicAvatarsAvatarIdGet(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<AvatarAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      Effect.gen(function* () {
        const file = yield* Hooks.readUpload(props.image_path, {
          types: IMAGE_TYPES,
          maxBytes: 10 << 20,
          what: "image",
        });
        const created = yield* M_avatars.createAvatarPublicAvatarsPost({
          name: props.name,
          image_file: file.blob,
        }).pipe(Effect.map(Crud.data));
        return { ...(created as AvatarAttributes), image_sha256: file.sha256 };
      }),
    update: ({ current, props, delta }) =>
      M_avatars.updateAvatarPublicAvatarsAvatarIdPatch({
        ...Crud.omit(delta, ["image_path"]),
        ...Crud.path({ ...props, ...current }, { avatar_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<AvatarAttributes, any, any>,
    list: () =>
      Paging.all(M_avatars.listAvatarsPublicAvatarsGet, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete avatars. The avatar was removed from Alchemy state but still exists in your Telnyx account.",
    preserve: ["image_sha256"],
    replaceIf: ({ news, output }) =>
      // The API cannot change an avatar's image: new content means a new avatar.
      Hooks.fileSha256(news.image_path).pipe(
        Effect.map(
          (sha) =>
            sha !== undefined && output?.image_sha256 !== undefined && sha !== output.image_sha256,
        ),
      ),
  });
