// Telnyx order: telnyx_porting_order in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_porting_orders from "#telnyx/services/porting_orders.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Order}: the create request and the update request of the Telnyx API.
 */
export type OrderProps = Omit<M_porting_orders.CreatePortingOrderRequest, "id"> &
  Partial<Omit<M_porting_orders.UpdatePortingOrderRequest, "id">>;

/**
 * Attributes of a deployed {@link Order}: the object as the Telnyx API returns it.
 */
export type OrderAttributes = NonNullable<M_porting_orders.GetPortingOrderResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Order} for `Order.lookup`.
 */
export interface OrderLookup {
  id: string;
}

export type Order = Resource<
  "Telnyx.Porting.Order",
  OrderProps,
  OrderAttributes,
  never,
  Providers,
  OrderLookup
>;

/**
 * An order to port phone numbers into Telnyx from another carrier.
 *
 * Changing `phone_numbers` replaces it.
 *
 * @resource
 * @product Porting
 */
export const Order = Resource<Order>("Telnyx.Porting.Order");

export const OrderProvider = () =>
  Crud.provider(Order, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["phone_numbers"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_porting_orders.getPortingOrder(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            OrderAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_porting_orders.createPortingOrder({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.first),
      ) as Effect.Effect<OrderAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_porting_orders.updatePortingOrder({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<OrderAttributes, any, any>,
    delete: (current) =>
      M_porting_orders.deletePortingOrder({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_porting_orders.listPortingOrders, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    normalize: (obj) =>
      // Created from phone numbers, read back with an object per number.
      Effect.succeed(Hooks.pluck(obj, "phone_numbers", "phone_number")),
  });
