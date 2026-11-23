// Telnyx mobile phone number: telnyx_mobile_phone_number in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_mobile_phone_numbers from "#telnyx/services/mobile_phone_numbers.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link MobilePhoneNumber}: the create request of the Telnyx API.
 */
export type MobilePhoneNumberProps = Omit<
  M_mobile_phone_numbers.UpdateMobilePhoneNumberRequest,
  "id"
> & {
  /**
   * The mobile phone number id.
   */
  mobile_phone_number_id: string;
};

/**
 * Attributes of a deployed {@link MobilePhoneNumber}: the object as the Telnyx API returns it.
 */
export type MobilePhoneNumberAttributes = NonNullable<
  M_mobile_phone_numbers.GetMobilePhoneNumberResponse["data"]
> & { mobile_phone_number_id: string };

/**
 * Identifies an existing {@link MobilePhoneNumber} for `MobilePhoneNumber.lookup`.
 */
export interface MobilePhoneNumberLookup {
  mobile_phone_number_id: string;
}

export type MobilePhoneNumber = Resource<
  "Telnyx.Numbers.MobilePhoneNumber",
  MobilePhoneNumberProps,
  MobilePhoneNumberAttributes,
  never,
  Providers,
  MobilePhoneNumberLookup
>;

/**
 * A mobile phone number in your account, with its voice settings (call forwarding, recording, CNAM, interception apps). Create adopts a number you already own. The API cannot delete mobile numbers, so destroy only removes the number from Alchemy state.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `mobile_phone_number_id` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const MobilePhoneNumber = Resource<MobilePhoneNumber>("Telnyx.Numbers.MobilePhoneNumber");

export const MobilePhoneNumberProvider = () =>
  Crud.provider(MobilePhoneNumber, {
    local: ["mobile_phone_number_id"],
    stables: ["mobile_phone_number_id"] as any,
    replaceOn: ["mobile_phone_number_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "mobile_phone_number_id" });
      return k
        ? (M_mobile_phone_numbers.getMobilePhoneNumber(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<MobilePhoneNumberAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_mobile_phone_numbers.updateMobilePhoneNumber({
        ...Crud.omit(props, ["mobile_phone_number_id"]),
        ...Crud.path(props, { id: "mobile_phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<MobilePhoneNumberAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_mobile_phone_numbers.updateMobilePhoneNumber({
        ...Crud.omit(delta, ["mobile_phone_number_id"]),
        ...Crud.path({ ...props, ...current }, { id: "mobile_phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<MobilePhoneNumberAttributes, any, any>,
    list: () =>
      Paging.all(
        M_mobile_phone_numbers.listMobilePhoneNumbers,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
    retain: () =>
      "The Telnyx API cannot delete mobile phone numbers. The number was removed from Alchemy state but is still in your Telnyx account with its current settings.",
  });
