// Telnyx tunnel: telnyx_tunnel in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_tunnels from "#telnyx/services/tunnels.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Tunnel}: the create request of the Telnyx API.
 */
export type TunnelProps = Omit<M_tunnels.CreateTunnelRequest, "id">;

/**
 * Attributes of a deployed {@link Tunnel}: the object as the Telnyx API returns it.
 */
export type TunnelAttributes = NonNullable<M_tunnels.GetTunnelResponse["data"]> & { id: string };

/**
 * Identifies an existing {@link Tunnel} for `Tunnel.lookup`.
 */
export interface TunnelLookup {
  id: string;
}

export type Tunnel = Resource<
  "Telnyx.Networking.Tunnel",
  TunnelProps,
  TunnelAttributes,
  never,
  Providers,
  TunnelLookup
>;

/**
 * A tunnel that lets a telnyx-edge process on your own host connect to Telnyx. The tunnel token is returned only on create and kept in state as a sensitive value.
 *
 * Changing `name` replaces it.
 *
 * @resource
 * @product Networking
 */
export const Tunnel = Resource<Tunnel>("Telnyx.Networking.Tunnel");

export const TunnelProvider = () =>
  Crud.provider(Tunnel, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["name"] as any,
    preserve: ["tunnel_token"],
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_tunnels.getTunnel(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            TunnelAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_tunnels.createTunnel({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<TunnelAttributes, any, any>,
    delete: (current) =>
      M_tunnels.deleteTunnel({ ...Crud.path(current, { id: "id" }) } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_tunnels.listTunnels, {} as any, "page-flat") as Effect.Effect<any, any, any>,
  });
