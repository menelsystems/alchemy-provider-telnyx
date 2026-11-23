// Telnyx network default gateway: telnyx_network_default_gateway in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_networks from "../../vendor/distilled-telnyx/src/services/networks.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link NetworkDefaultGateway}: the create request of the Telnyx API.
 */
export type NetworkDefaultGatewayProps = Omit<M_networks.CreateDefaultGatewayRequest, "id"> & {
  /**
   * Network ID.
   */
  network_id: string;
};

/**
 * Attributes of a deployed {@link NetworkDefaultGateway}: the object as the Telnyx API returns it.
 */
export type NetworkDefaultGatewayAttributes = NonNullable<
  M_networks.GetDefaultGatewayResponse["data"]
>[number] & { network_id: string };

/**
 * Identifies an existing {@link NetworkDefaultGateway} for `NetworkDefaultGateway.lookup`.
 */
export interface NetworkDefaultGatewayLookup {
  network_id: string;
}

export type NetworkDefaultGateway = Resource<
  "Telnyx.Networking.NetworkDefaultGateway",
  NetworkDefaultGatewayProps,
  NetworkDefaultGatewayAttributes,
  never,
  Providers,
  NetworkDefaultGatewayLookup
>;

/**
 * The default gateway of a network: the WireGuard peer that traffic without a more specific route leaves through. There is one per network, identified by the network id.
 *
 * Changing `network_id`, `wireguard_peer_id` replaces it.
 *
 * @resource
 * @product Networking
 */
export const NetworkDefaultGateway = Resource<NetworkDefaultGateway>(
  "Telnyx.Networking.NetworkDefaultGateway",
);

export const NetworkDefaultGatewayProvider = () =>
  Crud.provider(NetworkDefaultGateway, {
    local: ["network_id"],
    stables: ["network_id"] as any,
    replaceOn: ["network_id", "wireguard_peer_id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "network_id" });
      const parent = Crud.key(ref, { id: "network_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(M_networks.getDefaultGateway, { ...parent } as any, "none").pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["network_id"]) === id.id)),
      ) as Effect.Effect<NetworkDefaultGatewayAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_networks.createDefaultGateway({
        ...props,
        ...Crud.path(props, { id: "network_id" }),
      } as any).pipe(Effect.map(Crud.first)) as Effect.Effect<
        NetworkDefaultGatewayAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_networks.deleteDefaultGateway({ ...Crud.path(current, { id: "network_id" }) } as any).pipe(
        Effect.asVoid,
      ),
  });
