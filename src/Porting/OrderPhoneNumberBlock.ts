// Telnyx order phone number block: telnyx_porting_order_phone_number_block in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_porting_orders from "#telnyx/services/porting_orders.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link OrderPhoneNumberBlock}: the create request of the Telnyx API.
 */
export type OrderPhoneNumberBlockProps = Omit<
  M_porting_orders.CreatePortingPhoneNumberBlockRequest,
  "porting_order_id" | "id"
> & {
  /**
   * The porting order id.
   */
  porting_order_id: string;
};

/**
 * Attributes of a deployed {@link OrderPhoneNumberBlock}: the object as the Telnyx API returns it.
 */
export type OrderPhoneNumberBlockAttributes = NonNullable<
  M_porting_orders.ListPortingPhoneNumberBlocksResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link OrderPhoneNumberBlock} for `OrderPhoneNumberBlock.lookup`.
 */
export interface OrderPhoneNumberBlockLookup {
  porting_order_id: string;
  id: string;
}

export type OrderPhoneNumberBlock = Resource<
  "Telnyx.Porting.OrderPhoneNumberBlock",
  OrderPhoneNumberBlockProps,
  OrderPhoneNumberBlockAttributes,
  never,
  Providers,
  OrderPhoneNumberBlockLookup
>;

/**
 * A block of phone numbers in a porting order.
 *
 * Changing `activation_ranges`, `phone_number_range`, `porting_order_id` replaces it.
 *
 * @resource
 * @product Porting
 */
export const OrderPhoneNumberBlock = Resource<OrderPhoneNumberBlock>(
  "Telnyx.Porting.OrderPhoneNumberBlock",
);

export const OrderPhoneNumberBlockProvider = () =>
  Crud.provider(OrderPhoneNumberBlock, {
    local: ["id", "porting_order_id"],
    stables: ["id"] as any,
    replaceOn: ["activation_ranges", "phone_number_range", "porting_order_id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { porting_order_id: "porting_order_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_porting_orders.listPortingPhoneNumberBlocks,
        { ...parent } as any,
        "page-flat",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<OrderPhoneNumberBlockAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_porting_orders.createPortingPhoneNumberBlock({
        ...Crud.omit(props, ["porting_order_id"]),
        ...Crud.path(props, { porting_order_id: "porting_order_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        OrderPhoneNumberBlockAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_porting_orders.deletePortingPhoneNumberBlock({
        ...Crud.path(current, { porting_order_id: "porting_order_id", id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
