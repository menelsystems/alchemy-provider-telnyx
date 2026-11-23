// Telnyx outbound voice profile: telnyx_outbound_voice_profile in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_outbound_voice_profiles from "../../vendor/distilled-telnyx/src/services/outbound_voice_profiles.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link OutboundVoiceProfile}: the create request and the update request of the Telnyx API.
 */
export type OutboundVoiceProfileProps = Omit<
  M_outbound_voice_profiles.CreateVoiceProfileRequest,
  "id"
> &
  Partial<Omit<M_outbound_voice_profiles.UpdateOutboundVoiceProfileRequest, "id">>;

/**
 * Attributes of a deployed {@link OutboundVoiceProfile}: the object as the Telnyx API returns it.
 */
export type OutboundVoiceProfileAttributes = NonNullable<
  M_outbound_voice_profiles.GetOutboundVoiceProfileResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link OutboundVoiceProfile} for `OutboundVoiceProfile.lookup`.
 */
export interface OutboundVoiceProfileLookup {
  id: string;
}

export type OutboundVoiceProfile = Resource<
  "Telnyx.Voice.OutboundVoiceProfile",
  OutboundVoiceProfileProps,
  OutboundVoiceProfileAttributes,
  never,
  Providers,
  OutboundVoiceProfileLookup
>;

/**
 * An outbound voice profile, which sets limits and billing for outbound calls made through the connections that use it.
 *
 * @resource
 * @product Voice
 */
export const OutboundVoiceProfile = Resource<OutboundVoiceProfile>(
  "Telnyx.Voice.OutboundVoiceProfile",
);

export const OutboundVoiceProfileProvider = () =>
  Crud.provider(OutboundVoiceProfile, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_outbound_voice_profiles.getOutboundVoiceProfile(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<OutboundVoiceProfileAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_outbound_voice_profiles.createVoiceProfile({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        OutboundVoiceProfileAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_outbound_voice_profiles.updateOutboundVoiceProfile({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        OutboundVoiceProfileAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_outbound_voice_profiles.deleteOutboundVoiceProfile({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_outbound_voice_profiles.listOutboundVoiceProfiles,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
