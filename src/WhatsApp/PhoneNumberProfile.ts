// Telnyx phone number profile: telnyx_whatsapp_phone_number_profile in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_whatsapp_phone_numbers from "#telnyx/services/whatsapp_phone_numbers.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumberProfile}: the create request of the Telnyx API.
 */
export type PhoneNumberProfileProps = Omit<
  M_whatsapp_phone_numbers.PatchWhatsappProfileRequest2,
  "phone_number"
> & {
  /**
   * The phone number.
   */
  phone_number: string;
};

/**
 * Attributes of a deployed {@link PhoneNumberProfile}: the object as the Telnyx API returns it.
 */
export type PhoneNumberProfileAttributes = NonNullable<
  M_whatsapp_phone_numbers.GetWhatsappProfileResponse2["data"]
> & { phone_number: string };

/**
 * Identifies an existing {@link PhoneNumberProfile} for `PhoneNumberProfile.lookup`.
 */
export interface PhoneNumberProfileLookup {
  phone_number: string;
}

export type PhoneNumberProfile = Resource<
  "Telnyx.WhatsApp.PhoneNumberProfile",
  PhoneNumberProfileProps,
  PhoneNumberProfileAttributes,
  never,
  Providers,
  PhoneNumberProfileLookup
>;

/**
 * The WhatsApp business profile of a phone number, the description, address, website and contact details WhatsApp users see. Creating this resource adopts the profile of an existing number; destroying it leaves the profile as it is.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `phone_number` replaces it.
 *
 * @resource
 * @product WhatsApp
 */
export const PhoneNumberProfile = Resource<PhoneNumberProfile>(
  "Telnyx.WhatsApp.PhoneNumberProfile",
);

export const PhoneNumberProfileProvider = () =>
  Crud.provider(PhoneNumberProfile, {
    local: ["phone_number"],
    stables: ["phone_number"] as any,
    replaceOn: ["phone_number"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { phone_number: "phone_number" });
      return k
        ? (M_whatsapp_phone_numbers.getWhatsappProfile2(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PhoneNumberProfileAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_whatsapp_phone_numbers.patchWhatsappProfile2({
        ...Crud.omit(props, ["phone_number"]),
        ...Crud.path(props, { phone_number: "phone_number" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberProfileAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_whatsapp_phone_numbers.patchWhatsappProfile2({
        ...Crud.omit(delta, ["phone_number"]),
        ...Crud.path({ ...props, ...current }, { phone_number: "phone_number" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberProfileAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a WhatsApp business profile. It was removed from Alchemy state but keeps its current values in your Telnyx account.",
  });
