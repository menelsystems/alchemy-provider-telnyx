// Telnyx fqdn connection: telnyx_fqdn_connection in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_fqdn_connections from "../../vendor/distilled-telnyx/src/services/fqdn_connections.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link FQDNConnection}: the create request and the update request of the Telnyx API.
 */
export type FQDNConnectionProps = Omit<M_fqdn_connections.CreateFqdnConnectionRequest, "id"> &
  Partial<Omit<M_fqdn_connections.UpdateFqdnConnectionRequest, "id">>;

/**
 * Attributes of a deployed {@link FQDNConnection}: the object as the Telnyx API returns it.
 */
export type FQDNConnectionAttributes = NonNullable<
  M_fqdn_connections.GetFqdnConnectionResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link FQDNConnection} for `FQDNConnection.lookup`.
 */
export interface FQDNConnectionLookup {
  id: string;
}

export type FQDNConnection = Resource<
  "Telnyx.Voice.FQDNConnection",
  FQDNConnectionProps,
  FQDNConnectionAttributes,
  never,
  Providers,
  FQDNConnectionLookup
>;

/**
 * A SIP connection that sends calls to fully qualified domain names.
 *
 * Changing `microsoft_teams_sbc` replaces it.
 *
 * @resource
 * @product Voice
 */
export const FQDNConnection = Resource<FQDNConnection>("Telnyx.Voice.FQDNConnection");

export const FQDNConnectionProvider = () =>
  Crud.provider(FQDNConnection, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["microsoft_teams_sbc"] as any,
    preserve: ["password"],
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_fqdn_connections.getFqdnConnection(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<FQDNConnectionAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_fqdn_connections.createFqdnConnection({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<FQDNConnectionAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_fqdn_connections.updateFqdnConnection({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<FQDNConnectionAttributes, any, any>,
    delete: (current) =>
      M_fqdn_connections.deleteFqdnConnection({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_fqdn_connections.listFqdnConnections, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
