// Telnyx phone number calling routing: telnyx_whatsapp_phone_number_calling_routing in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_whatsapp_phone_numbers from "#telnyx/services/whatsapp_phone_numbers.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumberCallingRouting}: the create request of the Telnyx API.
 */
export type PhoneNumberCallingRoutingProps = Omit<
  M_whatsapp_phone_numbers.UpdateWhatsappCallingRoutingRequest,
  "id"
> & {
  /**
   * The BYON phone number in E.164 format, with the leading `+`.
   */
  phone_number: string;
};

/**
 * Attributes of a deployed {@link PhoneNumberCallingRouting}: the object as the Telnyx API returns it.
 */
export type PhoneNumberCallingRoutingAttributes = NonNullable<
  M_whatsapp_phone_numbers.GetWhatsappCallingRoutingResponse["data"]
> & { phone_number: string };

/**
 * Identifies an existing {@link PhoneNumberCallingRouting} for `PhoneNumberCallingRouting.lookup`.
 */
export interface PhoneNumberCallingRoutingLookup {
  phone_number: string;
}

export type PhoneNumberCallingRouting = Resource<
  "Telnyx.WhatsApp.PhoneNumberCallingRouting",
  PhoneNumberCallingRoutingProps,
  PhoneNumberCallingRoutingAttributes,
  never,
  Providers,
  PhoneNumberCallingRoutingLookup
>;

/**
 * The connection that receives inbound WhatsApp calls to a WhatsApp Calling BYON (bring your own number) phone number. Creating this resource adopts the routing of an existing number; destroying it leaves the routing as it is.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `phone_number` replaces it.
 *
 * @resource
 * @product WhatsApp
 */
export const PhoneNumberCallingRouting = Resource<PhoneNumberCallingRouting>(
  "Telnyx.WhatsApp.PhoneNumberCallingRouting",
);

export const PhoneNumberCallingRoutingProvider = () =>
  Crud.provider(PhoneNumberCallingRouting, {
    local: ["phone_number"],
    stables: ["phone_number"] as any,
    replaceOn: ["phone_number"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "phone_number" });
      return k
        ? (M_whatsapp_phone_numbers.getWhatsappCallingRouting(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PhoneNumberCallingRoutingAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_whatsapp_phone_numbers.updateWhatsappCallingRouting({
        ...props,
        ...Crud.path(props, { id: "phone_number" }),
      } as any) as Effect.Effect<PhoneNumberCallingRoutingAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_whatsapp_phone_numbers.updateWhatsappCallingRouting({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "phone_number" }),
      } as any) as Effect.Effect<PhoneNumberCallingRoutingAttributes, any, any>,
    retain: () =>
      "The Telnyx API cannot delete WhatsApp calling routing. It was removed from Alchemy state but stays in place in your Telnyx account.",
  });
