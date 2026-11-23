// Telnyx phone number: telnyx_phone_number in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_phone_number_configurations from "../../vendor/distilled-telnyx/src/services/phone_number_configurations.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PhoneNumber}: the create request of the Telnyx API.
 */
export type PhoneNumberProps = Omit<
  M_phone_number_configurations.UpdatePhoneNumberRequest,
  "id"
> & {
  /**
   * The phone number id.
   */
  phone_number_id: string;
  /**
   * Whether destroy deletes the object in Telnyx. By default destroy only removes it from Terraform state. Destroy uses the value in state, so set it to true and apply before destroying.
   */
  release_on_destroy?: boolean;
};

/**
 * Attributes of a deployed {@link PhoneNumber}: the object as the Telnyx API returns it.
 */
export type PhoneNumberAttributes = NonNullable<
  M_phone_number_configurations.GetPhoneNumberResponse["data"]
> & { phone_number_id: string };

/**
 * Identifies an existing {@link PhoneNumber} for `PhoneNumber.lookup`.
 */
export interface PhoneNumberLookup {
  phone_number_id: string;
}

export type PhoneNumber = Resource<
  "Telnyx.Numbers.PhoneNumber",
  PhoneNumberProps,
  PhoneNumberAttributes,
  never,
  Providers,
  PhoneNumberLookup
>;

/**
 * A phone number in your account. Create adopts a number you already own and manages its settings. Destroy keeps the number unless release_on_destroy is true.
 *
 * Destroy keeps it in your account unless `release_on_destroy: true`.
 * Changing `phone_number_id` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const PhoneNumber = Resource<PhoneNumber>("Telnyx.Numbers.PhoneNumber");

export const PhoneNumberProvider = () =>
  Crud.provider(PhoneNumber, {
    local: ["phone_number_id", "release_on_destroy"],
    stables: ["phone_number_id"] as any,
    replaceOn: ["phone_number_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "phone_number_id" });
      return k
        ? (M_phone_number_configurations.getPhoneNumber(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PhoneNumberAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_phone_number_configurations.updatePhoneNumber({
        ...Crud.omit(props, ["phone_number_id", "release_on_destroy"]),
        ...Crud.path(props, { id: "phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<PhoneNumberAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_phone_number_configurations.updatePhoneNumber({
        ...Crud.omit(delta, ["phone_number_id", "release_on_destroy"]),
        ...Crud.path({ ...props, ...current }, { id: "phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<PhoneNumberAttributes, any, any>,
    delete: (current) =>
      M_phone_number_configurations.deletePhoneNumber({
        ...Crud.path(current, { id: "phone_number_id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_phone_number_configurations.listPhoneNumbers,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
    retain: (props) =>
      props.release_on_destroy
        ? undefined
        : "This PhoneNumber stays in your Telnyx account, where it may still be billed. Set release_on_destroy: true and deploy before destroying to release it.",
  });
