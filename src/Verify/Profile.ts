// Telnyx profile: telnyx_verify_profile in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_verify from "#telnyx/services/verify.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Profile}: the create request and the update request of the Telnyx API.
 */
export type ProfileProps = Omit<M_verify.CreateVerifyProfileRequest, "verify_profile_id"> &
  Partial<Omit<M_verify.UpdateVerifyProfileRequest, "verify_profile_id">>;

/**
 * Attributes of a deployed {@link Profile}: the object as the Telnyx API returns it.
 */
export type ProfileAttributes = NonNullable<M_verify.VerifyProfileResponseDataWrapper["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Profile} for `Profile.lookup`.
 */
export interface ProfileLookup {
  id: string;
}

export type Profile = Resource<
  "Telnyx.Verify.Profile",
  ProfileProps,
  ProfileAttributes,
  never,
  Providers,
  ProfileLookup
>;

/**
 * A Verify profile, which sets how verification codes are sent and checked.
 *
 * Changing `flashcall` replaces it.
 *
 * @resource
 * @product Verify
 */
export const Profile = Resource<Profile>("Telnyx.Verify.Profile");

export const ProfileProvider = () =>
  Crud.provider(Profile, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["flashcall"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { verify_profile_id: "id" });
      return k
        ? (M_verify.getVerifyProfile(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            ProfileAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_verify.createVerifyProfile({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<ProfileAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_verify.updateVerifyProfile({
        ...delta,
        ...Crud.path({ ...props, ...current }, { verify_profile_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<ProfileAttributes, any, any>,
    delete: (current) =>
      M_verify.deleteProfile({ ...Crud.path(current, { verify_profile_id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_verify.listProfiles, {} as any, "page-flat") as Effect.Effect<any, any, any>,
  });
