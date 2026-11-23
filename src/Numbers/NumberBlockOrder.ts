// Telnyx number block order: telnyx_number_block_order in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_phone_number_block_orders from "../../vendor/distilled-telnyx/src/services/phone_number_block_orders.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link NumberBlockOrder}: the create request of the Telnyx API.
 */
export type NumberBlockOrderProps = Omit<
  M_phone_number_block_orders.CreateNumberBlockOrderRequest,
  "number_block_order_id"
>;

/**
 * Attributes of a deployed {@link NumberBlockOrder}: the object as the Telnyx API returns it.
 */
export type NumberBlockOrderAttributes = NonNullable<
  M_phone_number_block_orders.GetNumberBlockOrderResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link NumberBlockOrder} for `NumberBlockOrder.lookup`.
 */
export interface NumberBlockOrderLookup {
  id: string;
}

export type NumberBlockOrder = Resource<
  "Telnyx.Numbers.NumberBlockOrder",
  NumberBlockOrderProps,
  NumberBlockOrderAttributes,
  never,
  Providers,
  NumberBlockOrderLookup
>;

/**
 * An order for a contiguous block of phone numbers. Orders cannot be cancelled through the API.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `connection_id`, `customer_reference`, `messaging_profile_id`, `range`, `starting_number` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const NumberBlockOrder = Resource<NumberBlockOrder>("Telnyx.Numbers.NumberBlockOrder");

export const NumberBlockOrderProvider = () =>
  Crud.provider(NumberBlockOrder, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "connection_id",
      "customer_reference",
      "messaging_profile_id",
      "range",
      "starting_number",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { number_block_order_id: "id" });
      return k
        ? (M_phone_number_block_orders.getNumberBlockOrder(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<NumberBlockOrderAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_phone_number_block_orders.createNumberBlockOrder({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<NumberBlockOrderAttributes, any, any>,
    list: () =>
      Paging.all(
        M_phone_number_block_orders.listNumberBlockOrders,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
    retain: () =>
      "The Telnyx API cannot delete a NumberBlockOrder; it was removed from Alchemy state but still exists in your account.",
  });
