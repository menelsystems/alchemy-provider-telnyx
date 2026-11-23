// Telnyx hosted number order: telnyx_messaging_hosted_number_order in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_hosted_numbers from "#telnyx/services/hosted_numbers.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link HostedNumberOrder}: the create request of the Telnyx API.
 */
export type HostedNumberOrderProps = Omit<
  M_hosted_numbers.CreateMessagingHostedNumberOrderRequest,
  "id"
>;

/**
 * Attributes of a deployed {@link HostedNumberOrder}: the object as the Telnyx API returns it.
 */
export type HostedNumberOrderAttributes = NonNullable<
  M_hosted_numbers.GetMessagingHostedNumberOrderResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link HostedNumberOrder} for `HostedNumberOrder.lookup`.
 */
export interface HostedNumberOrderLookup {
  id: string;
}

export type HostedNumberOrder = Resource<
  "Telnyx.Messaging.HostedNumberOrder",
  HostedNumberOrderProps,
  HostedNumberOrderAttributes,
  never,
  Providers,
  HostedNumberOrderLookup
>;

/**
 * An order to host numbers you own with another carrier on Telnyx for messaging. After creating it, upload the LOA and bill and verify ownership with the hosted number order actions.
 *
 * Changing `messaging_profile_id`, `phone_numbers` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const HostedNumberOrder = Resource<HostedNumberOrder>("Telnyx.Messaging.HostedNumberOrder");

export const HostedNumberOrderProvider = () =>
  Crud.provider(HostedNumberOrder, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["messaging_profile_id", "phone_numbers"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_hosted_numbers.getMessagingHostedNumberOrder(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<HostedNumberOrderAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_hosted_numbers.createMessagingHostedNumberOrder({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<HostedNumberOrderAttributes, any, any>,
    delete: (current) =>
      M_hosted_numbers.deleteMessagingHostedNumberOrder({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_hosted_numbers.listMessagingHostedNumberOrders,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
