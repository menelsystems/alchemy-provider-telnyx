// Telnyx order associated phone number: telnyx_porting_order_associated_phone_number in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_porting_orders from "../../vendor/distilled-telnyx/src/services/porting_orders.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link OrderAssociatedPhoneNumber}: the create request of the Telnyx API.
 */
export type OrderAssociatedPhoneNumberProps = Omit<
  M_porting_orders.CreatePortingAssociatedPhoneNumberRequest,
  "porting_order_id" | "id"
> & {
  /**
   * Identifies the porting order associated with this phone number.
   */
  porting_order_id: string;
};

/**
 * Attributes of a deployed {@link OrderAssociatedPhoneNumber}: the object as the Telnyx API returns it.
 */
export type OrderAssociatedPhoneNumberAttributes = NonNullable<
  M_porting_orders.ListPortingAssociatedPhoneNumbersResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link OrderAssociatedPhoneNumber} for `OrderAssociatedPhoneNumber.lookup`.
 */
export interface OrderAssociatedPhoneNumberLookup {
  porting_order_id: string;
  id: string;
}

export type OrderAssociatedPhoneNumber = Resource<
  "Telnyx.Porting.OrderAssociatedPhoneNumber",
  OrderAssociatedPhoneNumberProps,
  OrderAssociatedPhoneNumberAttributes,
  never,
  Providers,
  OrderAssociatedPhoneNumberLookup
>;

/**
 * A phone number range associated with a porting order, and what to do with it when the order completes.
 *
 * Changing `action`, `phone_number_range`, `porting_order_id` replaces it.
 *
 * @resource
 * @product Porting
 */
export const OrderAssociatedPhoneNumber = Resource<OrderAssociatedPhoneNumber>(
  "Telnyx.Porting.OrderAssociatedPhoneNumber",
);

export const OrderAssociatedPhoneNumberProvider = () =>
  Crud.provider(OrderAssociatedPhoneNumber, {
    local: ["id", "porting_order_id"],
    stables: ["id"] as any,
    replaceOn: ["action", "phone_number_range", "porting_order_id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { porting_order_id: "porting_order_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_porting_orders.listPortingAssociatedPhoneNumbers,
        { ...parent } as any,
        "page-flat",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<OrderAssociatedPhoneNumberAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_porting_orders.createPortingAssociatedPhoneNumber({
        ...props,
        ...Crud.path(props, { porting_order_id: "porting_order_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        OrderAssociatedPhoneNumberAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_porting_orders.deletePortingAssociatedPhoneNumber({
        ...Crud.path(current, { porting_order_id: "porting_order_id", id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
