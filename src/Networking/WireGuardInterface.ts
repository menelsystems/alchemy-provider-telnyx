// Telnyx wireguard interface: telnyx_wireguard_interface in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_wire_guard_interfaces from "#telnyx/services/wire_guard_interfaces.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link WireGuardInterface}: the create request of the Telnyx API.
 */
export type WireGuardInterfaceProps = Omit<
  M_wire_guard_interfaces.CreateWireguardInterfaceRequest,
  "id"
>;

/**
 * Attributes of a deployed {@link WireGuardInterface}: the object as the Telnyx API returns it.
 */
export type WireGuardInterfaceAttributes = NonNullable<
  M_wire_guard_interfaces.GetWireguardInterfaceResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link WireGuardInterface} for `WireGuardInterface.lookup`.
 */
export interface WireGuardInterfaceLookup {
  id: string;
}

export type WireGuardInterface = Resource<
  "Telnyx.Networking.WireGuardInterface",
  WireGuardInterfaceProps,
  WireGuardInterfaceAttributes,
  never,
  Providers,
  WireGuardInterfaceLookup
>;

/**
 * A WireGuard interface on a network that WireGuard peers connect to.
 *
 * Changing `enable_sip_trunking`, `name`, `network_id`, `region_code` replaces it.
 *
 * @resource
 * @product Networking
 */
export const WireGuardInterface = Resource<WireGuardInterface>(
  "Telnyx.Networking.WireGuardInterface",
);

export const WireGuardInterfaceProvider = () =>
  Crud.provider(WireGuardInterface, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["enable_sip_trunking", "name", "network_id", "region_code"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_wire_guard_interfaces.getWireguardInterface(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<WireGuardInterfaceAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_wire_guard_interfaces.createWireguardInterface({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<WireGuardInterfaceAttributes, any, any>,
    delete: (current) =>
      M_wire_guard_interfaces.deleteWireguardInterface({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_wire_guard_interfaces.listWireguardInterfaces,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
