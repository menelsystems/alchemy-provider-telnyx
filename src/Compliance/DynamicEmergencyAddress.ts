// Telnyx dynamic emergency address: telnyx_dynamic_emergency_address in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_dynamic_emergency_addresses from "#telnyx/services/dynamic_emergency_addresses.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link DynamicEmergencyAddress}: the create request of the Telnyx API.
 */
export type DynamicEmergencyAddressProps = Omit<
  M_dynamic_emergency_addresses.CreateDynamicEmergencyAddressRequest,
  "id"
>;

/**
 * Attributes of a deployed {@link DynamicEmergencyAddress}: the object as the Telnyx API returns it.
 */
export type DynamicEmergencyAddressAttributes = NonNullable<
  M_dynamic_emergency_addresses.GetDynamicEmergencyAddressResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link DynamicEmergencyAddress} for `DynamicEmergencyAddress.lookup`.
 */
export interface DynamicEmergencyAddressLookup {
  id: string;
}

export type DynamicEmergencyAddress = Resource<
  "Telnyx.Compliance.DynamicEmergencyAddress",
  DynamicEmergencyAddressProps,
  DynamicEmergencyAddressAttributes,
  never,
  Providers,
  DynamicEmergencyAddressLookup
>;

/**
 * An address for dynamic emergency calling. Addresses cannot be changed; a new value replaces the address.
 *
 * Changing `administrative_area`, `country_code`, `extended_address`, `house_number`, `house_suffix`, `locality`, `postal_code`, `street_name`, `street_post_directional`, `street_pre_directional`, `street_suffix` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const DynamicEmergencyAddress = Resource<DynamicEmergencyAddress>(
  "Telnyx.Compliance.DynamicEmergencyAddress",
);

export const DynamicEmergencyAddressProvider = () =>
  Crud.provider(DynamicEmergencyAddress, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "administrative_area",
      "country_code",
      "extended_address",
      "house_number",
      "house_suffix",
      "locality",
      "postal_code",
      "street_name",
      "street_post_directional",
      "street_pre_directional",
      "street_suffix",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_dynamic_emergency_addresses.getDynamicEmergencyAddress(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<DynamicEmergencyAddressAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_dynamic_emergency_addresses.createDynamicEmergencyAddress({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        DynamicEmergencyAddressAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_dynamic_emergency_addresses.deleteDynamicEmergencyAddress({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_dynamic_emergency_addresses.listDynamicEmergencyAddresses,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
