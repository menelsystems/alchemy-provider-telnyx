// Telnyx network: telnyx_network in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_networks from "#telnyx/services/networks.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Network}: the create request and the update request of the Telnyx API.
 */
export type NetworkProps = Omit<M_networks.CreateNetworkRequest, "id"> &
  Partial<Omit<M_networks.UpdateNetworkRequest, "id">>;

/**
 * Attributes of a deployed {@link Network}: the object as the Telnyx API returns it.
 */
export type NetworkAttributes = NonNullable<M_networks.GetNetworkResponse["data"]> & { id: string };

/**
 * Identifies an existing {@link Network} for `Network.lookup`.
 */
export interface NetworkLookup {
  id: string;
}

export type Network = Resource<
  "Telnyx.Networking.Network",
  NetworkProps,
  NetworkAttributes,
  never,
  Providers,
  NetworkLookup
>;

/**
 * A private Telnyx network that interfaces such as WireGuard interfaces and wireless gateways join.
 *
 * @resource
 * @product Networking
 */
export const Network = Resource<Network>("Telnyx.Networking.Network");

export const NetworkProvider = () =>
  Crud.provider(Network, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_networks.getNetwork(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            NetworkAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_networks.createNetwork({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<NetworkAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_networks.updateNetwork({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<NetworkAttributes, any, any>,
    delete: (current) =>
      M_networks.deleteNetwork({ ...Crud.path(current, { id: "id" }) } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_networks.listNetworks, {} as any, "page-flat") as Effect.Effect<any, any, any>,
  });
