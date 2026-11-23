// Telnyx verified number: telnyx_verified_number in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_verified_numbers from "../../vendor/distilled-telnyx/src/services/verified_numbers.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link VerifiedNumber}: the create request of the Telnyx API.
 */
export type VerifiedNumberProps = Omit<
  M_verified_numbers.CreateVerifiedNumberRequest,
  "phone_number"
> & {
  /**
   * phone_number
   */
  phone_number: string;
};

/**
 * Attributes of a deployed {@link VerifiedNumber}: the object as the Telnyx API returns it.
 */
export type VerifiedNumberAttributes = NonNullable<
  M_verified_numbers.VerifiedNumberResponseDataWrapper["data"]
> & { phone_number: string };

/**
 * Identifies an existing {@link VerifiedNumber} for `VerifiedNumber.lookup`.
 */
export interface VerifiedNumberLookup {
  phone_number: string;
}

export type VerifiedNumber = Resource<
  "Telnyx.Messaging.VerifiedNumber",
  VerifiedNumberProps,
  VerifiedNumberAttributes,
  never,
  Providers,
  VerifiedNumberLookup
>;

/**
 * A phone number you verified ownership of, such as for caller id. Creating it sends a verification code by SMS or call.
 *
 * Changing `extension`, `phone_number`, `verification_method` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const VerifiedNumber = Resource<VerifiedNumber>("Telnyx.Messaging.VerifiedNumber");

export const VerifiedNumberProvider = () =>
  Crud.provider(VerifiedNumber, {
    local: ["phone_number"],
    stables: ["phone_number"] as any,
    replaceOn: ["extension", "phone_number", "verification_method"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { phone_number: "phone_number" });
      return k
        ? (M_verified_numbers.getVerifiedNumber(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<VerifiedNumberAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_verified_numbers.createVerifiedNumber({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<VerifiedNumberAttributes, any, any>,
    delete: (current) =>
      M_verified_numbers.deleteVerifiedNumber({
        ...Crud.path(current, { phone_number: "phone_number" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_verified_numbers.listVerifiedNumbers, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
