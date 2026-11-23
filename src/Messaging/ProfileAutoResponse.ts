// Telnyx profile auto response: telnyx_messaging_profile_auto_response in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_opt_out_management from "../../vendor/distilled-telnyx/src/services/opt_out_management.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link ProfileAutoResponse}: the create request and the update request of the Telnyx API.
 */
export type ProfileAutoResponseProps = Omit<
  M_opt_out_management.CreateAutorespConfigRequest,
  "profile_id" | "autoresp_cfg_id"
> &
  Partial<
    Omit<M_opt_out_management.UpdateAutoRespConfigRequest, "profile_id" | "autoresp_cfg_id">
  > & {
    /**
     * The messaging profile id.
     */
    messaging_profile_id: string;
  };

/**
 * Attributes of a deployed {@link ProfileAutoResponse}: the object as the Telnyx API returns it.
 */
export type ProfileAutoResponseAttributes = NonNullable<
  M_opt_out_management.AutorespConfigResponseSchema["data"]
> & { id: string };

/**
 * Identifies an existing {@link ProfileAutoResponse} for `ProfileAutoResponse.lookup`.
 */
export interface ProfileAutoResponseLookup {
  messaging_profile_id: string;
  id: string;
}

export type ProfileAutoResponse = Resource<
  "Telnyx.Messaging.ProfileAutoResponse",
  ProfileAutoResponseProps,
  ProfileAutoResponseAttributes,
  never,
  Providers,
  ProfileAutoResponseLookup
>;

/**
 * An auto-response setting on a messaging profile, which answers inbound messages containing given keywords (opt-in, opt-out or help) with a fixed reply.
 *
 * Changing `messaging_profile_id` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const ProfileAutoResponse = Resource<ProfileAutoResponse>(
  "Telnyx.Messaging.ProfileAutoResponse",
);

export const ProfileAutoResponseProvider = () =>
  Crud.provider(ProfileAutoResponse, {
    local: ["id", "messaging_profile_id"],
    stables: ["id"] as any,
    replaceOn: ["messaging_profile_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { profile_id: "messaging_profile_id", autoresp_cfg_id: "id" });
      return k
        ? (M_opt_out_management.getAutorespConfig(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<ProfileAutoResponseAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_opt_out_management.createAutorespConfig({
        ...Crud.omit(props, ["messaging_profile_id"]),
        ...Crud.path(props, { profile_id: "messaging_profile_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        ProfileAutoResponseAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_opt_out_management.updateAutoRespConfig({
        ...Crud.omit(props, ["messaging_profile_id"]),
        ...Crud.path(
          { ...props, ...current },
          { profile_id: "messaging_profile_id", autoresp_cfg_id: "id" },
        ),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        ProfileAutoResponseAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_opt_out_management.deleteAutorespConfig({
        ...Crud.path(current, { profile_id: "messaging_profile_id", autoresp_cfg_id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
