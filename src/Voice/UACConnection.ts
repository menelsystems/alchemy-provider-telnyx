// Telnyx uac connection: telnyx_uac_connection in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_uac_connections from "../../vendor/distilled-telnyx/src/services/uac_connections.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link UACConnection}: the create request and the update request of the Telnyx API.
 */
export type UACConnectionProps = Omit<M_uac_connections.CreateUacConnectionRequest, "id"> &
  Partial<Omit<M_uac_connections.UpdateUacConnectionRequest, "id">>;

/**
 * Attributes of a deployed {@link UACConnection}: the object as the Telnyx API returns it.
 */
export type UACConnectionAttributes = NonNullable<
  M_uac_connections.GetUacConnectionResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link UACConnection} for `UACConnection.lookup`.
 */
export interface UACConnectionLookup {
  id: string;
}

export type UACConnection = Resource<
  "Telnyx.Voice.UACConnection",
  UACConnectionProps,
  UACConnectionAttributes,
  never,
  Providers,
  UACConnectionLookup
>;

/**
 * A SIP connection on which Telnyx registers with an external SIP server as a user agent client.
 *
 * @resource
 * @product Voice
 */
export const UACConnection = Resource<UACConnection>("Telnyx.Voice.UACConnection");

export const UACConnectionProvider = () =>
  Crud.provider(UACConnection, {
    local: ["id"],
    stables: ["id"] as any,
    preserve: ["password"],
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_uac_connections.getUacConnection(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<UACConnectionAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_uac_connections.createUacConnection({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<UACConnectionAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_uac_connections.updateUacConnection({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<UACConnectionAttributes, any, any>,
    delete: (current) =>
      M_uac_connections.deleteUacConnection({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_uac_connections.listUacConnections, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
