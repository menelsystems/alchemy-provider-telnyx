// Telnyx credential connection: telnyx_credential_connection in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_credential_connections from "../../vendor/distilled-telnyx/src/services/credential_connections.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link CredentialConnection}: the create request and the update request of the Telnyx API.
 */
export type CredentialConnectionProps = Omit<
  M_credential_connections.CreateCredentialConnectionRequest,
  "id"
> &
  Partial<Omit<M_credential_connections.UpdateCredentialConnectionRequest, "id">>;

/**
 * Attributes of a deployed {@link CredentialConnection}: the object as the Telnyx API returns it.
 */
export type CredentialConnectionAttributes = NonNullable<
  M_credential_connections.GetCredentialConnectionResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link CredentialConnection} for `CredentialConnection.lookup`.
 */
export interface CredentialConnectionLookup {
  id: string;
}

export type CredentialConnection = Resource<
  "Telnyx.Voice.CredentialConnection",
  CredentialConnectionProps,
  CredentialConnectionAttributes,
  never,
  Providers,
  CredentialConnectionLookup
>;

/**
 * A SIP connection that authenticates with a username and password.
 *
 * @resource
 * @product Voice
 */
export const CredentialConnection = Resource<CredentialConnection>(
  "Telnyx.Voice.CredentialConnection",
);

export const CredentialConnectionProvider = () =>
  Crud.provider(CredentialConnection, {
    local: ["id"],
    stables: ["id"] as any,
    preserve: ["password"],
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_credential_connections.getCredentialConnection(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<CredentialConnectionAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_credential_connections.createCredentialConnection({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        CredentialConnectionAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_credential_connections.updateCredentialConnection({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        CredentialConnectionAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_credential_connections.deleteCredentialConnection({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_credential_connections.listCredentialConnections,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
