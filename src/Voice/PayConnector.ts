// Telnyx pay connector: telnyx_pay_connector in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_pay_connectors from "#telnyx/services/pay_connectors.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link PayConnector}: the create request and the update request of the Telnyx API.
 */
export type PayConnectorProps = Omit<M_pay_connectors.CreatePayConnectorRequest, "name"> &
  Partial<Omit<M_pay_connectors.UpdatePayConnectorRequest, "name">> & {
    /**
     * Connector name used for retrieval, update, deletion and Pay.
     */
    name: string;
  };

/**
 * Attributes of a deployed {@link PayConnector}: the object as the Telnyx API returns it.
 */
export type PayConnectorAttributes = NonNullable<M_pay_connectors.PayConnectorResponse["data"]> & {
  name: string;
};

/**
 * Identifies an existing {@link PayConnector} for `PayConnector.lookup`.
 */
export interface PayConnectorLookup {
  name: string;
}

export type PayConnector = Resource<
  "Telnyx.Voice.PayConnector",
  PayConnectorProps,
  PayConnectorAttributes,
  never,
  Providers,
  PayConnectorLookup
>;

/**
 * A Pay connector, which takes card payments during calls through your payment gateway.
 *
 * Changing `name` replaces it.
 *
 * @resource
 * @product Voice
 */
export const PayConnector = Resource<PayConnector>("Telnyx.Voice.PayConnector");

export const PayConnectorProvider = () =>
  Crud.provider(PayConnector, {
    local: ["name"],
    stables: ["name"] as any,
    replaceOn: ["name"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { name: "name" });
      return k
        ? (M_pay_connectors.getPayConnector(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            PayConnectorAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_pay_connectors.createPayConnector({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<PayConnectorAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_pay_connectors.updatePayConnector({
        ...delta,
        ...Crud.path({ ...props, ...current }, { name: "name" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<PayConnectorAttributes, any, any>,
    delete: (current) =>
      M_pay_connectors.deletePayConnector({ ...Crud.path(current, { name: "name" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_pay_connectors.listPayConnectors, {} as any, "cursor") as Effect.Effect<
        any,
        any,
        any
      >,
  });
