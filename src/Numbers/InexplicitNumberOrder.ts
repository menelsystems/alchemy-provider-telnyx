// Telnyx inexplicit number order: telnyx_inexplicit_number_order in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_inexplicit_number_orders from "../../vendor/distilled-telnyx/src/services/inexplicit_number_orders.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link InexplicitNumberOrder}: the create request of the Telnyx API.
 */
export type InexplicitNumberOrderProps = Omit<
  M_inexplicit_number_orders.CreateInexplicitNumberOrderRequest,
  "id"
>;

/**
 * Attributes of a deployed {@link InexplicitNumberOrder}: the object as the Telnyx API returns it.
 */
export type InexplicitNumberOrderAttributes = NonNullable<
  M_inexplicit_number_orders.GetInexplicitNumberOrderResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link InexplicitNumberOrder} for `InexplicitNumberOrder.lookup`.
 */
export interface InexplicitNumberOrderLookup {
  id: string;
}

export type InexplicitNumberOrder = Resource<
  "Telnyx.Numbers.InexplicitNumberOrder",
  InexplicitNumberOrderProps,
  InexplicitNumberOrderAttributes,
  never,
  Providers,
  InexplicitNumberOrderLookup
>;

/**
 * An order for phone numbers by criteria, such as a quantity in an area, instead of specific numbers. Orders cannot be cancelled through the API.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `billing_group_id`, `connection_id`, `customer_reference`, `messaging_profile_id`, `ordering_groups` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const InexplicitNumberOrder = Resource<InexplicitNumberOrder>(
  "Telnyx.Numbers.InexplicitNumberOrder",
);

export const InexplicitNumberOrderProvider = () =>
  Crud.provider(InexplicitNumberOrder, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "billing_group_id",
      "connection_id",
      "customer_reference",
      "messaging_profile_id",
      "ordering_groups",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_inexplicit_number_orders.getInexplicitNumberOrder(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<InexplicitNumberOrderAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_inexplicit_number_orders.createInexplicitNumberOrder({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        InexplicitNumberOrderAttributes,
        any,
        any
      >,
    list: () =>
      Paging.all(
        M_inexplicit_number_orders.listInexplicitNumberOrders,
        {} as any,
        "none",
      ) as Effect.Effect<any, any, any>,
    retain: () =>
      "The Telnyx API cannot delete a InexplicitNumberOrder; it was removed from Alchemy state but still exists in your account.",
  });
