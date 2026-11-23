// Telnyx external connection: telnyx_external_connection in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_external_connections from "../../vendor/distilled-telnyx/src/services/external_connections.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link ExternalConnection}: the create request and the update request of the Telnyx API.
 */
export type ExternalConnectionProps = Omit<
  M_external_connections.CreateExternalConnectionRequest,
  "id"
> &
  Partial<Omit<M_external_connections.UpdateExternalConnectionRequest, "id">>;

/**
 * Attributes of a deployed {@link ExternalConnection}: the object as the Telnyx API returns it.
 */
export type ExternalConnectionAttributes = NonNullable<
  M_external_connections.GetExternalConnectionResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link ExternalConnection} for `ExternalConnection.lookup`.
 */
export interface ExternalConnectionLookup {
  id: string;
}

export type ExternalConnection = Resource<
  "Telnyx.Voice.ExternalConnection",
  ExternalConnectionProps,
  ExternalConnectionAttributes,
  never,
  Providers,
  ExternalConnectionLookup
>;

/**
 * An external connection, which brings voice from Microsoft Teams or another external platform to Telnyx numbers.
 *
 * Changing `external_sip_connection` replaces it.
 *
 * @resource
 * @product Voice
 */
export const ExternalConnection = Resource<ExternalConnection>("Telnyx.Voice.ExternalConnection");

export const ExternalConnectionProvider = () =>
  Crud.provider(ExternalConnection, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["external_sip_connection"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_external_connections.getExternalConnection(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<ExternalConnectionAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_external_connections.createExternalConnection({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        ExternalConnectionAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_external_connections.updateExternalConnection({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        ExternalConnectionAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_external_connections.deleteExternalConnection({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_external_connections.listExternalConnections,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
