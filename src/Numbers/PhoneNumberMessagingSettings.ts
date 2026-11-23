// Telnyx phone number messaging settings: telnyx_phone_number_messaging_settings in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_number_settings from "#telnyx/services/number_settings.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumberMessagingSettings}: the create request of the Telnyx API.
 */
export type PhoneNumberMessagingSettingsProps = Omit<
  M_number_settings.UpdatePhoneNumberMessagingSettingsRequest,
  "id"
> & {
  /**
   * The phone number id.
   */
  phone_number_id: string;
};

/**
 * Attributes of a deployed {@link PhoneNumberMessagingSettings}: the object as the Telnyx API returns it.
 */
export type PhoneNumberMessagingSettingsAttributes = NonNullable<
  M_number_settings.GetPhoneNumberMessagingSettingsResponse["data"]
> & { phone_number_id: string };

/**
 * Identifies an existing {@link PhoneNumberMessagingSettings} for `PhoneNumberMessagingSettings.lookup`.
 */
export interface PhoneNumberMessagingSettingsLookup {
  phone_number_id: string;
}

export type PhoneNumberMessagingSettings = Resource<
  "Telnyx.Numbers.PhoneNumberMessagingSettings",
  PhoneNumberMessagingSettingsProps,
  PhoneNumberMessagingSettingsAttributes,
  never,
  Providers,
  PhoneNumberMessagingSettingsLookup
>;

/**
 * The messaging settings of a phone number. Destroy removes them from Alchemy state only.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `phone_number_id` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const PhoneNumberMessagingSettings = Resource<PhoneNumberMessagingSettings>(
  "Telnyx.Numbers.PhoneNumberMessagingSettings",
);

export const PhoneNumberMessagingSettingsProvider = () =>
  Crud.provider(PhoneNumberMessagingSettings, {
    local: ["phone_number_id"],
    stables: ["phone_number_id"] as any,
    replaceOn: ["phone_number_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "phone_number_id" });
      return k
        ? (M_number_settings.getPhoneNumberMessagingSettings(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PhoneNumberMessagingSettingsAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_number_settings.updatePhoneNumberMessagingSettings({
        ...Crud.omit(props, ["phone_number_id"]),
        ...Crud.path(props, { id: "phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberMessagingSettingsAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_number_settings.updatePhoneNumberMessagingSettings({
        ...Crud.omit(delta, ["phone_number_id"]),
        ...Crud.path({ ...props, ...current }, { id: "phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberMessagingSettingsAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a PhoneNumberMessagingSettings; it was removed from Alchemy state but still exists in your account.",
  });
