// Telnyx inbound voice channel settings: telnyx_inbound_voice_channel_settings in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_voice_channels from "../../vendor/distilled-telnyx/src/services/voice_channels.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link InboundVoiceChannelSettings}: the create request of the Telnyx API.
 */
export type InboundVoiceChannelSettingsProps = Omit<
  M_voice_channels.UpdateOutboundChannelsRequest,
  never
>;

/**
 * Attributes of a deployed {@link InboundVoiceChannelSettings}: the object as the Telnyx API returns it.
 */
export type InboundVoiceChannelSettingsAttributes = NonNullable<
  M_voice_channels.ListInboundChannelsResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link InboundVoiceChannelSettings} for `InboundVoiceChannelSettings.lookup`.
 */
export interface InboundVoiceChannelSettingsLookup {
  id: string;
}

export type InboundVoiceChannelSettings = Resource<
  "Telnyx.Voice.InboundVoiceChannelSettings",
  InboundVoiceChannelSettingsProps,
  InboundVoiceChannelSettingsAttributes,
  never,
  Providers,
  InboundVoiceChannelSettingsLookup
>;

/**
 * The number of inbound voice channels of the account in the US zone. There is one per account; destroy removes it from Alchemy state only.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 *
 * @resource
 * @product Voice
 */
export const InboundVoiceChannelSettings = Resource<InboundVoiceChannelSettings>(
  "Telnyx.Voice.InboundVoiceChannelSettings",
);

export const InboundVoiceChannelSettingsProvider = () =>
  Crud.provider(InboundVoiceChannelSettings, {
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, {});
      return k
        ? (M_voice_channels.listInboundChannels(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<InboundVoiceChannelSettingsAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_voice_channels.updateOutboundChannels({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<InboundVoiceChannelSettingsAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_voice_channels.updateOutboundChannels({
        ...delta,
        ...Crud.path({ ...props, ...current }, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        InboundVoiceChannelSettingsAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a InboundVoiceChannelSettings; it was removed from Alchemy state but still exists in your account.",
  });
