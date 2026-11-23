// Telnyx phone number calling settings: telnyx_whatsapp_phone_number_calling_settings in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_whatsapp_phone_numbers from "#telnyx/services/whatsapp_phone_numbers.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumberCallingSettings}: the create request of the Telnyx API.
 */
export type PhoneNumberCallingSettingsProps = Omit<
  M_whatsapp_phone_numbers.PatchWhatsappCallingSettingsRequest2,
  "phone_number"
> & {
  /**
   * The WhatsApp phone number in E.164 format.
   */
  phone_number: string;
};

/**
 * Attributes of a deployed {@link PhoneNumberCallingSettings}: the object as the Telnyx API returns it.
 */
export type PhoneNumberCallingSettingsAttributes = NonNullable<
  M_whatsapp_phone_numbers.GetWhatsappCallingSettingsResponse2["data"]
> & { phone_number: string };

/**
 * Identifies an existing {@link PhoneNumberCallingSettings} for `PhoneNumberCallingSettings.lookup`.
 */
export interface PhoneNumberCallingSettingsLookup {
  phone_number: string;
}

export type PhoneNumberCallingSettings = Resource<
  "Telnyx.WhatsApp.PhoneNumberCallingSettings",
  PhoneNumberCallingSettingsProps,
  PhoneNumberCallingSettingsAttributes,
  never,
  Providers,
  PhoneNumberCallingSettingsLookup
>;

/**
 * Whether WhatsApp calling is enabled for a WhatsApp phone number. Creating this resource adopts the setting of an existing number; destroying it leaves the setting as it is.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `phone_number` replaces it.
 *
 * @resource
 * @product WhatsApp
 */
export const PhoneNumberCallingSettings = Resource<PhoneNumberCallingSettings>(
  "Telnyx.WhatsApp.PhoneNumberCallingSettings",
);

export const PhoneNumberCallingSettingsProvider = () =>
  Crud.provider(PhoneNumberCallingSettings, {
    local: ["phone_number"],
    stables: ["phone_number"] as any,
    replaceOn: ["phone_number"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { phone_number: "phone_number" });
      return k
        ? (M_whatsapp_phone_numbers.getWhatsappCallingSettings2(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PhoneNumberCallingSettingsAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_whatsapp_phone_numbers.patchWhatsappCallingSettings2({
        ...props,
        ...Crud.path(props, { phone_number: "phone_number" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberCallingSettingsAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_whatsapp_phone_numbers.patchWhatsappCallingSettings2({
        ...delta,
        ...Crud.path({ ...props, ...current }, { phone_number: "phone_number" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberCallingSettingsAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete WhatsApp calling settings. They were removed from Alchemy state but keep their current values in your Telnyx account.",
  });
