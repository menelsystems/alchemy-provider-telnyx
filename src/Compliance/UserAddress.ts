// Telnyx user address: telnyx_user_address in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_user_addresses from "../../vendor/distilled-telnyx/src/services/user_addresses.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link UserAddress}: the create request of the Telnyx API.
 */
export type UserAddressProps = Omit<M_user_addresses.CreateUserAddressRequest, "id">;

/**
 * Attributes of a deployed {@link UserAddress}: the object as the Telnyx API returns it.
 */
export type UserAddressAttributes = NonNullable<M_user_addresses.GetUserAddressResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link UserAddress} for `UserAddress.lookup`.
 */
export interface UserAddressLookup {
  id: string;
}

export type UserAddress = Resource<
  "Telnyx.Compliance.UserAddress",
  UserAddressProps,
  UserAddressAttributes,
  never,
  Providers,
  UserAddressLookup
>;

/**
 * An address of a user, used for number orders and emergency services. The Telnyx API cannot change or delete user addresses.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `administrative_area`, `borough`, `business_name`, `country_code`, `customer_reference`, `extended_address`, `first_name`, `last_name`, `locality`, `neighborhood`, `phone_number`, `postal_code`, `skip_address_verification`, `street_address` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const UserAddress = Resource<UserAddress>("Telnyx.Compliance.UserAddress");

export const UserAddressProvider = () =>
  Crud.provider(UserAddress, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "administrative_area",
      "borough",
      "business_name",
      "country_code",
      "customer_reference",
      "extended_address",
      "first_name",
      "last_name",
      "locality",
      "neighborhood",
      "phone_number",
      "postal_code",
      "skip_address_verification",
      "street_address",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_user_addresses.getUserAddress(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            UserAddressAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_user_addresses.createUserAddress({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<UserAddressAttributes, any, any>,
    list: () =>
      Paging.all(M_user_addresses.findUserAddress, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a UserAddress; it was removed from Alchemy state but still exists in your account.",
  });
