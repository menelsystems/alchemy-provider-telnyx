// Telnyx access ip address: telnyx_access_ip_address in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ip_addresses from "#telnyx/services/ip_addresses.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AccessIPAddress}: the create request of the Telnyx API.
 */
export type AccessIPAddressProps = Omit<
  M_ip_addresses.CreateAccessIpAddressRequest,
  "access_ip_address_id"
>;

/**
 * Attributes of a deployed {@link AccessIPAddress}: the object as the Telnyx API returns it.
 */
export type AccessIPAddressAttributes = M_ip_addresses.AccessIPAddressResponseSchema & {
  id: string;
};

/**
 * Identifies an existing {@link AccessIPAddress} for `AccessIPAddress.lookup`.
 */
export interface AccessIPAddressLookup {
  id: string;
}

export type AccessIPAddress = Resource<
  "Telnyx.Account.AccessIPAddress",
  AccessIPAddressProps,
  AccessIPAddressAttributes,
  never,
  Providers,
  AccessIPAddressLookup
>;

/**
 * An IP address allowed to reach the Telnyx API and portal for your account.
 *
 * Changing `description`, `ip_address` replaces it.
 *
 * @resource
 * @product Account
 */
export const AccessIPAddress = Resource<AccessIPAddress>("Telnyx.Account.AccessIPAddress");

export const AccessIPAddressProvider = () =>
  Crud.provider(AccessIPAddress, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["description", "ip_address"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { access_ip_address_id: "id" });
      return k
        ? (M_ip_addresses.getAccessIpAddress(k as any) as Effect.Effect<
            AccessIPAddressAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ip_addresses.createAccessIpAddress({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<AccessIPAddressAttributes, any, any>,
    delete: (current) =>
      M_ip_addresses.deleteAccessIpAddress({
        ...Crud.path(current, { access_ip_address_id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_ip_addresses.listAccessIpAddresses, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
