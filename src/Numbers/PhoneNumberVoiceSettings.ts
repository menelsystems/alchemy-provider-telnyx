// Telnyx phone number voice settings: telnyx_phone_number_voice_settings in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_phone_number_configurations from "../../vendor/distilled-telnyx/src/services/phone_number_configurations.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumberVoiceSettings}: the create request of the Telnyx API.
 */
export type PhoneNumberVoiceSettingsProps = Omit<
  M_phone_number_configurations.UpdatePhoneNumberVoiceSettingsRequest,
  "id"
> & {
  /**
   * The phone number id.
   */
  phone_number_id: string;
};

/**
 * Attributes of a deployed {@link PhoneNumberVoiceSettings}: the object as the Telnyx API returns it.
 */
export type PhoneNumberVoiceSettingsAttributes = NonNullable<
  M_phone_number_configurations.GetPhoneNumberVoiceSettingsResponse["data"]
> & { phone_number_id: string };

/**
 * Identifies an existing {@link PhoneNumberVoiceSettings} for `PhoneNumberVoiceSettings.lookup`.
 */
export interface PhoneNumberVoiceSettingsLookup {
  phone_number_id: string;
}

export type PhoneNumberVoiceSettings = Resource<
  "Telnyx.Numbers.PhoneNumberVoiceSettings",
  PhoneNumberVoiceSettingsProps,
  PhoneNumberVoiceSettingsAttributes,
  never,
  Providers,
  PhoneNumberVoiceSettingsLookup
>;

/**
 * The voice settings of a phone number.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `phone_number_id` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const PhoneNumberVoiceSettings = Resource<PhoneNumberVoiceSettings>(
  "Telnyx.Numbers.PhoneNumberVoiceSettings",
);

export const PhoneNumberVoiceSettingsProvider = () =>
  Crud.provider(PhoneNumberVoiceSettings, {
    local: ["phone_number_id"],
    stables: ["phone_number_id"] as any,
    replaceOn: ["phone_number_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "phone_number_id" });
      return k
        ? (M_phone_number_configurations.getPhoneNumberVoiceSettings(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PhoneNumberVoiceSettingsAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_phone_number_configurations.updatePhoneNumberVoiceSettings({
        ...Crud.omit(props, ["phone_number_id"]),
        ...Crud.path(props, { id: "phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberVoiceSettingsAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_phone_number_configurations.updatePhoneNumberVoiceSettings({
        ...Crud.omit(delta, ["phone_number_id"]),
        ...Crud.path({ ...props, ...current }, { id: "phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberVoiceSettingsAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a PhoneNumberVoiceSettings; it was removed from Alchemy state but still exists in your account.",
  });
