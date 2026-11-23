// Telnyx profile: telnyx_messaging_profile in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_profiles from "#telnyx/services/profiles.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Profile}: the create request and the update request of the Telnyx API.
 */
export type ProfileProps = Omit<M_profiles.CreateMessagingProfileRequest, "id"> &
  Partial<Omit<M_profiles.UpdateMessagingProfileRequest, "id">>;

/**
 * Attributes of a deployed {@link Profile}: the object as the Telnyx API returns it.
 */
export type ProfileAttributes = NonNullable<M_profiles.GetMessagingProfileResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Profile} for `Profile.lookup`.
 */
export interface ProfileLookup {
  id: string;
}

export type Profile = Resource<
  "Telnyx.Messaging.Profile",
  ProfileProps,
  ProfileAttributes,
  never,
  Providers,
  ProfileLookup
>;

/**
 * A messaging profile, which groups the settings for sending and receiving SMS and MMS (webhooks, allowed destinations, number pool, spend limits) shared by the numbers assigned to it.
 *
 * Changing `health_webhook_url`, `resource_group_id` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const Profile = Resource<Profile>("Telnyx.Messaging.Profile");

export const ProfileProvider = () =>
  Crud.provider(Profile, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["health_webhook_url", "resource_group_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_profiles.getMessagingProfile(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            ProfileAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_profiles.createMessagingProfile({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<ProfileAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_profiles.updateMessagingProfile({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<ProfileAttributes, any, any>,
    delete: (current) =>
      M_profiles.deleteMessagingProfile({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_profiles.listMessagingProfiles, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
