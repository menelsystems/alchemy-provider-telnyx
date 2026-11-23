// Telnyx private wireless gateway: telnyx_private_wireless_gateway in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_private_wireless_gateways from "#telnyx/services/private_wireless_gateways.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PrivateWirelessGateway}: the create request of the Telnyx API.
 */
export type PrivateWirelessGatewayProps = Omit<
  M_private_wireless_gateways.CreatePrivateWirelessGatewayRequest,
  "id"
>;

/**
 * Attributes of a deployed {@link PrivateWirelessGateway}: the object as the Telnyx API returns it.
 */
export type PrivateWirelessGatewayAttributes = NonNullable<
  M_private_wireless_gateways.GetPrivateWirelessGatewayResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link PrivateWirelessGateway} for `PrivateWirelessGateway.lookup`.
 */
export interface PrivateWirelessGatewayLookup {
  id: string;
}

export type PrivateWirelessGateway = Resource<
  "Telnyx.Wireless.PrivateWirelessGateway",
  PrivateWirelessGatewayProps,
  PrivateWirelessGatewayAttributes,
  never,
  Providers,
  PrivateWirelessGatewayLookup
>;

/**
 * A private wireless gateway that connects the SIM cards of a SIM card group to a network.
 *
 * Changing `address_mode`, `name`, `network_id`, `region_code` replaces it.
 *
 * @resource
 * @product Wireless
 */
export const PrivateWirelessGateway = Resource<PrivateWirelessGateway>(
  "Telnyx.Wireless.PrivateWirelessGateway",
);

export const PrivateWirelessGatewayProvider = () =>
  Crud.provider(PrivateWirelessGateway, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["address_mode", "name", "network_id", "region_code"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_private_wireless_gateways.getPrivateWirelessGateway(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PrivateWirelessGatewayAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_private_wireless_gateways.createPrivateWirelessGateway({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<PrivateWirelessGatewayAttributes, any, any>,
    delete: (current) =>
      M_private_wireless_gateways.deleteWirelessGateway({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_private_wireless_gateways.getPrivateWirelessGateways,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
