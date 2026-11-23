// Telnyx voice channel zone: telnyx_voice_channel_zone in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_voice_channels from "#telnyx/services/voice_channels.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link VoiceChannelZone}: the create request of the Telnyx API.
 */
export type VoiceChannelZoneProps = Omit<
  M_voice_channels.PatchChannelZoneRequest,
  "channel_zone_id"
> & {
  /**
   * The channel zone id.
   */
  channel_zone_id: string;
};

/**
 * Attributes of a deployed {@link VoiceChannelZone}: the object as the Telnyx API returns it.
 */
export type VoiceChannelZoneAttributes = NonNullable<
  M_voice_channels.GetChannelZonesResponse["data"]
>[number] & { channel_zone_id: string };

/**
 * Identifies an existing {@link VoiceChannelZone} for `VoiceChannelZone.lookup`.
 */
export interface VoiceChannelZoneLookup {
  channel_zone_id: string;
}

export type VoiceChannelZone = Resource<
  "Telnyx.Voice.VoiceChannelZone",
  VoiceChannelZoneProps,
  VoiceChannelZoneAttributes,
  never,
  Providers,
  VoiceChannelZoneLookup
>;

/**
 * The number of voice channels in a non-US zone. Zones cannot be created or deleted; destroy removes it from Alchemy state only.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `channel_zone_id` replaces it.
 *
 * @resource
 * @product Voice
 */
export const VoiceChannelZone = Resource<VoiceChannelZone>("Telnyx.Voice.VoiceChannelZone");

export const VoiceChannelZoneProvider = () =>
  Crud.provider(VoiceChannelZone, {
    local: ["channel_zone_id"],
    stables: ["channel_zone_id"] as any,
    replaceOn: ["channel_zone_id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "channel_zone_id" });
      const parent = Crud.key(ref, {});
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(M_voice_channels.getChannelZones, { ...parent } as any, "page-flat").pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<VoiceChannelZoneAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_voice_channels.patchChannelZone({
        ...Crud.omit(props, ["channel_zone_id"]),
        ...Crud.path(props, { channel_zone_id: "channel_zone_id" }),
      } as any) as Effect.Effect<VoiceChannelZoneAttributes, any, any>,
    update: ({ current, props }) =>
      M_voice_channels.patchChannelZone({
        ...Crud.omit(props, ["channel_zone_id"]),
        ...Crud.path({ ...props, ...current }, { channel_zone_id: "channel_zone_id" }),
      } as any) as Effect.Effect<VoiceChannelZoneAttributes, any, any>,
    list: () =>
      Paging.all(M_voice_channels.getChannelZones, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a VoiceChannelZone; it was removed from Alchemy state but still exists in your account.",
  });
