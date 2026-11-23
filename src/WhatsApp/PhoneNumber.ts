// Telnyx phone number: telnyx_whatsapp_phone_number in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_whatsapp_phone_numbers from "../../vendor/distilled-telnyx/src/services/whatsapp_phone_numbers.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumber}: the create request of the Telnyx API.
 */
export type PhoneNumberProps = Omit<
  M_whatsapp_phone_numbers.InitializeWhatsappVerificationRequest2,
  "id" | "phone_number"
> & {
  /**
   * The phone number to register, in E.164 format. It identifies the number in the other WhatsApp resources.
   */
  phone_number: string;
  /**
   * The whatsapp business account id.
   */
  whatsapp_business_account_id: string;
};

/**
 * Attributes of a deployed {@link PhoneNumber}: the object as the Telnyx API returns it.
 */
export type PhoneNumberAttributes = NonNullable<
  M_whatsapp_phone_numbers.GetWhatsappPhoneNumberByPhoneNumberResponse["data"]
> & { phone_number: string };

/**
 * Identifies an existing {@link PhoneNumber} for `PhoneNumber.lookup`.
 */
export interface PhoneNumberLookup {
  whatsapp_business_account_id: string;
  phone_number: string;
}

export type PhoneNumber = Resource<
  "Telnyx.WhatsApp.PhoneNumber",
  PhoneNumberProps,
  PhoneNumberAttributes,
  never,
  Providers,
  PhoneNumberLookup
>;

/**
 * A phone number registered for WhatsApp with a WhatsApp Business Account. Creating it starts registration and sends a verification code to the number by SMS or voice call; complete registration with the telnyx_whatsapp_phone_number_verify action (telnyx_whatsapp_phone_number_resend_verification sends a new code). Destroying it removes the number's WhatsApp registration.
 *
 * Changing `display_name`, `language`, `phone_number`, `verification_method`, `whatsapp_business_account_id` replaces it.
 *
 * @resource
 * @product WhatsApp
 */
export const PhoneNumber = Resource<PhoneNumber>("Telnyx.WhatsApp.PhoneNumber");

export const PhoneNumberProvider = () =>
  Crud.provider(PhoneNumber, {
    local: ["phone_number", "whatsapp_business_account_id"],
    stables: ["phone_number"] as any,
    replaceOn: [
      "display_name",
      "language",
      "phone_number",
      "verification_method",
      "whatsapp_business_account_id",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { phone_number: "phone_number" });
      return k
        ? (M_whatsapp_phone_numbers.getWhatsappPhoneNumberByPhoneNumber(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PhoneNumberAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_whatsapp_phone_numbers.initializeWhatsappVerification2({
        ...Crud.omit(props, ["whatsapp_business_account_id"]),
        ...Crud.path(props, { id: "whatsapp_business_account_id" }),
      } as any) as Effect.Effect<PhoneNumberAttributes, any, any>,
    delete: (current) =>
      M_whatsapp_phone_numbers.deleteWhatsappPhoneNumberByPhoneNumber({
        ...Crud.path(current, { phone_number: "phone_number" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_whatsapp_phone_numbers.listPhoneNumbers2,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
