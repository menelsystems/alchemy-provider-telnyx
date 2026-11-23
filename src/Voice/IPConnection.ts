// Telnyx ip connection: telnyx_ip_connection in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ip_connections from "../../vendor/distilled-telnyx/src/services/ip_connections.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link IPConnection}: the create request and the update request of the Telnyx API.
 */
export type IPConnectionProps = Omit<M_ip_connections.CreateIpConnectionRequest, "id"> &
  Partial<Omit<M_ip_connections.UpdateIpConnectionRequest, "id">>;

/**
 * Attributes of a deployed {@link IPConnection}: the object as the Telnyx API returns it.
 */
export type IPConnectionAttributes = NonNullable<
  M_ip_connections.GetIpConnectionResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link IPConnection} for `IPConnection.lookup`.
 */
export interface IPConnectionLookup {
  id: string;
}

export type IPConnection = Resource<
  "Telnyx.Voice.IPConnection",
  IPConnectionProps,
  IPConnectionAttributes,
  never,
  Providers,
  IPConnectionLookup
>;

/**
 * A SIP connection that authenticates by source IP address.
 *
 * @resource
 * @product Voice
 */
export const IPConnection = Resource<IPConnection>("Telnyx.Voice.IPConnection");

export const IPConnectionProvider = () =>
  Crud.provider(IPConnection, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_ip_connections.getIpConnection(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            IPConnectionAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ip_connections.createIpConnection({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<IPConnectionAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_ip_connections.updateIpConnection({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<IPConnectionAttributes, any, any>,
    delete: (current) =>
      M_ip_connections.deleteIpConnection({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_ip_connections.listIpConnections, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
