// Telnyx user profile: telnyx_user_profile in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_user_profile from "#telnyx/services/user_profile.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link UserProfile}: the create request of the Telnyx API.
 */
export type UserProfileProps = Omit<M_user_profile.UpdateUserProfileRequest, never>;

/**
 * Attributes of a deployed {@link UserProfile}: the object as the Telnyx API returns it.
 */
export type UserProfileAttributes = NonNullable<M_user_profile.GetUserProfileResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link UserProfile} for `UserProfile.lookup`.
 */
export interface UserProfileLookup {
  id: string;
}

export type UserProfile = Resource<
  "Telnyx.Account.UserProfile",
  UserProfileProps,
  UserProfileAttributes,
  never,
  Providers,
  UserProfileLookup
>;

/**
 * The profile of the user the API key belongs to: name, business details, address and notification settings (beta). There is one per user; destroy removes it from Alchemy state only.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 *
 * @resource
 * @product Account
 */
export const UserProfile = Resource<UserProfile>("Telnyx.Account.UserProfile");

export const UserProfileProvider = () =>
  Crud.provider(UserProfile, {
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, {});
      return k
        ? (M_user_profile.getUserProfile(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            UserProfileAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_user_profile.updateUserProfile({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<UserProfileAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_user_profile.updateUserProfile({
        ...delta,
        ...Crud.path({ ...props, ...current }, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<UserProfileAttributes, any, any>,
    retain: () =>
      "The Telnyx API cannot delete a UserProfile; it was removed from Alchemy state but still exists in your account.",
  });
