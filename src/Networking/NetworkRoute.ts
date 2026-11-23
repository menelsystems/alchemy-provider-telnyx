// Telnyx network route: telnyx_network_route in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_network_routes from "../../vendor/distilled-telnyx/src/services/network_routes.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link NetworkRoute}: the create request of the Telnyx API.
 */
export type NetworkRouteProps = Omit<M_network_routes.CreateNetworkRouteRequest, "id">;

/**
 * Attributes of a deployed {@link NetworkRoute}: the object as the Telnyx API returns it.
 */
export type NetworkRouteAttributes = NonNullable<
  M_network_routes.GetNetworkRouteResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link NetworkRoute} for `NetworkRoute.lookup`.
 */
export interface NetworkRouteLookup {
  id: string;
}

export type NetworkRoute = Resource<
  "Telnyx.Networking.NetworkRoute",
  NetworkRouteProps,
  NetworkRouteAttributes,
  never,
  Providers,
  NetworkRouteLookup
>;

/**
 * A route on a network that sends traffic for a CIDR through a next hop.
 *
 * Changing `cidr`, `network_id`, `next_hop` replaces it.
 *
 * @resource
 * @product Networking
 */
export const NetworkRoute = Resource<NetworkRoute>("Telnyx.Networking.NetworkRoute");

export const NetworkRouteProvider = () =>
  Crud.provider(NetworkRoute, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["cidr", "network_id", "next_hop"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_network_routes.getNetworkRoute(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            NetworkRouteAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_network_routes.createNetworkRoute({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<NetworkRouteAttributes, any, any>,
    delete: (current) =>
      M_network_routes.deleteNetworkRoute({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_network_routes.listNetworkRoutes, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
