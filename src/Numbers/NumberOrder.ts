// Telnyx number order: telnyx_number_order in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_phone_number_orders from "../../vendor/distilled-telnyx/src/services/phone_number_orders.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link NumberOrder}: the create request and the update request of the Telnyx API.
 */
export type NumberOrderProps = Omit<
  M_phone_number_orders.CreateNumberOrderRequest,
  "number_order_id"
> &
  Partial<Omit<M_phone_number_orders.UpdateNumberOrderRequest, "number_order_id">>;

/**
 * Attributes of a deployed {@link NumberOrder}: the object as the Telnyx API returns it.
 */
export type NumberOrderAttributes = NonNullable<
  M_phone_number_orders.GetNumberOrderResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link NumberOrder} for `NumberOrder.lookup`.
 */
export interface NumberOrderLookup {
  id: string;
}

export type NumberOrder = Resource<
  "Telnyx.Numbers.NumberOrder",
  NumberOrderProps,
  NumberOrderAttributes,
  never,
  Providers,
  NumberOrderLookup
>;

/**
 * An order for phone numbers.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `billing_group_id`, `connection_id`, `messaging_profile_id`, `phone_numbers` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const NumberOrder = Resource<NumberOrder>("Telnyx.Numbers.NumberOrder");

export const NumberOrderProvider = () =>
  Crud.provider(NumberOrder, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "billing_group_id",
      "connection_id",
      "messaging_profile_id",
      "phone_numbers",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { number_order_id: "id" });
      return k
        ? (M_phone_number_orders.getNumberOrder(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<NumberOrderAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_phone_number_orders.createNumberOrder({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<NumberOrderAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_phone_number_orders.updateNumberOrder({
        ...delta,
        ...Crud.path({ ...props, ...current }, { number_order_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<NumberOrderAttributes, any, any>,
    list: () =>
      Paging.all(M_phone_number_orders.listNumberOrders, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: (props) => {
      // The API cannot cancel an order; name the numbers that stay.
      const numbers = (props.phone_numbers ?? []).map((n: any) => n?.phone_number).filter(Boolean);
      return `The Telnyx API cannot cancel a number order, so it was only removed from Alchemy state.${numbers.length ? ` These numbers stay in your account until you release them: ${numbers.join(", ")}.` : ""}`;
    },
    wait: (created) =>
      // A number order completes asynchronously.
      Hooks.waitForStatus(
        M_phone_number_orders.getNumberOrder({ number_order_id: created.id } as any).pipe(
          Effect.map(Crud.data),
        ),
        { ready: ["success"], failed: ["failure"], what: `number order ${created.id}` },
      ) as Effect.Effect<NumberOrderAttributes, any, any>,
  });
