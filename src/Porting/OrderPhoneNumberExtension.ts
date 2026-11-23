// Telnyx order phone number extension: telnyx_porting_order_phone_number_extension in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_porting_orders from "#telnyx/services/porting_orders.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link OrderPhoneNumberExtension}: the create request of the Telnyx API.
 */
export type OrderPhoneNumberExtensionProps = Omit<
  M_porting_orders.CreatePortingPhoneNumberExtensionRequest,
  "porting_order_id" | "id"
> & {
  /**
   * The porting order id.
   */
  porting_order_id: string;
};

/**
 * Attributes of a deployed {@link OrderPhoneNumberExtension}: the object as the Telnyx API returns it.
 */
export type OrderPhoneNumberExtensionAttributes = NonNullable<
  M_porting_orders.ListPortingPhoneNumberExtensionsResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link OrderPhoneNumberExtension} for `OrderPhoneNumberExtension.lookup`.
 */
export interface OrderPhoneNumberExtensionLookup {
  porting_order_id: string;
  id: string;
}

export type OrderPhoneNumberExtension = Resource<
  "Telnyx.Porting.OrderPhoneNumberExtension",
  OrderPhoneNumberExtensionProps,
  OrderPhoneNumberExtensionAttributes,
  never,
  Providers,
  OrderPhoneNumberExtensionLookup
>;

/**
 * A range of extensions of a phone number in a porting order.
 *
 * Changing `activation_ranges`, `extension_range`, `porting_order_id`, `porting_phone_number_id` replaces it.
 *
 * @resource
 * @product Porting
 */
export const OrderPhoneNumberExtension = Resource<OrderPhoneNumberExtension>(
  "Telnyx.Porting.OrderPhoneNumberExtension",
);

export const OrderPhoneNumberExtensionProvider = () =>
  Crud.provider(OrderPhoneNumberExtension, {
    local: ["id", "porting_order_id"],
    stables: ["id"] as any,
    replaceOn: [
      "activation_ranges",
      "extension_range",
      "porting_order_id",
      "porting_phone_number_id",
    ] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { porting_order_id: "porting_order_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_porting_orders.listPortingPhoneNumberExtensions,
        { ...parent } as any,
        "page-flat",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<OrderPhoneNumberExtensionAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_porting_orders.createPortingPhoneNumberExtension({
        ...Crud.omit(props, ["porting_order_id"]),
        ...Crud.path(props, { porting_order_id: "porting_order_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        OrderPhoneNumberExtensionAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_porting_orders.deletePortingPhoneNumberExtension({
        ...Crud.path(current, { porting_order_id: "porting_order_id", id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
