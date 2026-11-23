// Telnyx phone number conversational components: telnyx_whatsapp_phone_number_conversational_components in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_whatsapp_phone_numbers from "#telnyx/services/whatsapp_phone_numbers.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumberConversationalComponents}: the create request of the Telnyx API.
 */
export type PhoneNumberConversationalComponentsProps = Omit<
  M_whatsapp_phone_numbers.PatchWhatsappConversationalComponentsRequest2,
  "phone_number"
> & {
  /**
   * The WhatsApp phone number in E.164 format.
   */
  phone_number: string;
};

/**
 * Attributes of a deployed {@link PhoneNumberConversationalComponents}: the object as the Telnyx API returns it.
 */
export type PhoneNumberConversationalComponentsAttributes = NonNullable<
  M_whatsapp_phone_numbers.GetWhatsappConversationalComponentsResponse2["data"]
> & { phone_number: string };

/**
 * Identifies an existing {@link PhoneNumberConversationalComponents} for `PhoneNumberConversationalComponents.lookup`.
 */
export interface PhoneNumberConversationalComponentsLookup {
  phone_number: string;
}

export type PhoneNumberConversationalComponents = Resource<
  "Telnyx.WhatsApp.PhoneNumberConversationalComponents",
  PhoneNumberConversationalComponentsProps,
  PhoneNumberConversationalComponentsAttributes,
  never,
  Providers,
  PhoneNumberConversationalComponentsLookup
>;

/**
 * The conversational components of a WhatsApp phone number, the ice breakers and commands WhatsApp users see when they open a chat with the business. Creating this resource adopts the components of an existing number; destroying it leaves them as they are.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `phone_number` replaces it.
 *
 * @resource
 * @product WhatsApp
 */
export const PhoneNumberConversationalComponents = Resource<PhoneNumberConversationalComponents>(
  "Telnyx.WhatsApp.PhoneNumberConversationalComponents",
);

export const PhoneNumberConversationalComponentsProvider = () =>
  Crud.provider(PhoneNumberConversationalComponents, {
    local: ["phone_number"],
    stables: ["phone_number"] as any,
    replaceOn: ["phone_number"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { phone_number: "phone_number" });
      return k
        ? (M_whatsapp_phone_numbers.getWhatsappConversationalComponents2(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PhoneNumberConversationalComponentsAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_whatsapp_phone_numbers.patchWhatsappConversationalComponents2({
        ...props,
        ...Crud.path(props, { phone_number: "phone_number" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberConversationalComponentsAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_whatsapp_phone_numbers.patchWhatsappConversationalComponents2({
        ...delta,
        ...Crud.path({ ...props, ...current }, { phone_number: "phone_number" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        PhoneNumberConversationalComponentsAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete WhatsApp conversational components. They were removed from Alchemy state but stay configured in your Telnyx account.",
  });
