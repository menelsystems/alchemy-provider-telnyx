// Telnyx dialogflow connection: telnyx_dialogflow_connection in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_dialogflow_integration from "../../vendor/distilled-telnyx/src/services/dialogflow_integration.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link DialogflowConnection}: the create request and the update request of the Telnyx API.
 */
export type DialogflowConnectionProps = Omit<
  M_dialogflow_integration.CreateDialogflowConnectionRequest,
  "connection_id"
> &
  Partial<Omit<M_dialogflow_integration.UpdateDialogflowConnectionRequest, "connection_id">> & {
    /**
     * Uniquely identifies a Telnyx application (Call Control).
     */
    connection_id: string;
  };

/**
 * Attributes of a deployed {@link DialogflowConnection}: the object as the Telnyx API returns it.
 */
export type DialogflowConnectionAttributes = NonNullable<
  M_dialogflow_integration.DialogflowConnectionResponse["data"]
> & { connection_id: string };

/**
 * Identifies an existing {@link DialogflowConnection} for `DialogflowConnection.lookup`.
 */
export interface DialogflowConnectionLookup {
  connection_id: string;
}

export type DialogflowConnection = Resource<
  "Telnyx.Voice.DialogflowConnection",
  DialogflowConnectionProps,
  DialogflowConnectionAttributes,
  never,
  Providers,
  DialogflowConnectionLookup
>;

/**
 * The Google Dialogflow integration of a connection.
 *
 * Changing `connection_id` replaces it.
 *
 * @resource
 * @product Voice
 */
export const DialogflowConnection = Resource<DialogflowConnection>(
  "Telnyx.Voice.DialogflowConnection",
);

export const DialogflowConnectionProvider = () =>
  Crud.provider(DialogflowConnection, {
    local: ["connection_id"],
    stables: ["connection_id"] as any,
    replaceOn: ["connection_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { connection_id: "connection_id" });
      return k
        ? (M_dialogflow_integration.getDialogflowConnection(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<DialogflowConnectionAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_dialogflow_integration.createDialogflowConnection({
        ...props,
        ...Crud.path(props, { connection_id: "connection_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        DialogflowConnectionAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_dialogflow_integration.updateDialogflowConnection({
        ...props,
        ...Crud.path({ ...props, ...current }, { connection_id: "connection_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        DialogflowConnectionAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_dialogflow_integration.deleteDialogflowConnection({
        ...Crud.path(current, { connection_id: "connection_id" }),
      } as any).pipe(Effect.asVoid),
  });
