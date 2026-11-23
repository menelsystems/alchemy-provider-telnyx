// Telnyx address: telnyx_address in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_addresses from "../../vendor/distilled-telnyx/src/services/addresses.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Address}: the create request of the Telnyx API.
 */
export type AddressProps = Omit<M_addresses.CreateAddressRequest, "id">;

/**
 * Attributes of a deployed {@link Address}: the object as the Telnyx API returns it.
 */
export type AddressAttributes = NonNullable<M_addresses.GetAddressResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Address} for `Address.lookup`.
 */
export interface AddressLookup {
  id: string;
}

export type Address = Resource<
  "Telnyx.Compliance.Address",
  AddressProps,
  AddressAttributes,
  never,
  Providers,
  AddressLookup
>;

/**
 * A postal address used for emergency services and number orders. Addresses cannot be changed; a new value replaces the address.
 *
 * Changing `address_book`, `administrative_area`, `borough`, `business_name`, `country_code`, `customer_reference`, `extended_address`, `first_name`, `last_name`, `locality`, `neighborhood`, `phone_number`, `postal_code`, `street_address`, `validate_address` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const Address = Resource<Address>("Telnyx.Compliance.Address");

export const AddressProvider = () =>
  Crud.provider(Address, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "address_book",
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
      "street_address",
      "validate_address",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_addresses.getAddress(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            AddressAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_addresses.createAddress({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<AddressAttributes, any, any>,
    delete: (current) =>
      M_addresses.deleteAddress({ ...Crud.path(current, { id: "id" }) } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_addresses.findAddresses, {} as any, "page-flat") as Effect.Effect<any, any, any>,
  });
