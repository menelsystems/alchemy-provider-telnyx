// Telnyx siprec connector: telnyx_siprec_connector in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_siprec_connectors from "#telnyx/services/siprec_connectors.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link SiprecConnector}: the create request and the update request of the Telnyx API.
 */
export type SiprecConnectorProps = Omit<
  M_siprec_connectors.CreateSiprecConnectorRequest,
  "connector_name"
> &
  Partial<Omit<M_siprec_connectors.UpdateSiprecConnectorRequest, "connector_name">>;

/**
 * Attributes of a deployed {@link SiprecConnector}: the object as the Telnyx API returns it.
 */
export type SiprecConnectorAttributes = NonNullable<
  M_siprec_connectors.SiprecConnectorResponse["data"]
> & { name: string };

/**
 * Identifies an existing {@link SiprecConnector} for `SiprecConnector.lookup`.
 */
export interface SiprecConnectorLookup {
  name: string;
}

export type SiprecConnector = Resource<
  "Telnyx.Voice.SiprecConnector",
  SiprecConnectorProps,
  SiprecConnectorAttributes,
  never,
  Providers,
  SiprecConnectorLookup
>;

/**
 * A SIPREC connector, which sends call media to a SIP recording server.
 *
 * Changing `name` replaces it.
 *
 * @resource
 * @product Voice
 */
export const SiprecConnector = Resource<SiprecConnector>("Telnyx.Voice.SiprecConnector");

export const SiprecConnectorProvider = () =>
  Crud.provider(SiprecConnector, {
    local: ["name"],
    stables: ["name"] as any,
    replaceOn: ["name"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { connector_name: "name" });
      return k
        ? (M_siprec_connectors.getSiprecConnector(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<SiprecConnectorAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_siprec_connectors.createSiprecConnector({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<SiprecConnectorAttributes, any, any>,
    update: ({ current, props }) =>
      M_siprec_connectors.updateSiprecConnector({
        ...props,
        ...Crud.path({ ...props, ...current }, { connector_name: "name" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<SiprecConnectorAttributes, any, any>,
    delete: (current) =>
      M_siprec_connectors.deleteSiprecConnector({
        ...Crud.path(current, { connector_name: "name" }),
      } as any).pipe(Effect.asVoid),
  });
