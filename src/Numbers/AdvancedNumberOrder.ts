// Telnyx advanced number order: telnyx_advanced_number_order in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_advanced_number_orders from "#telnyx/services/advanced_number_orders.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AdvancedNumberOrder}: the create request of the Telnyx API.
 */
export type AdvancedNumberOrderProps = Omit<
  M_advanced_number_orders.CreateAdvancedOrderV2Request,
  "order_id"
>;

/**
 * Attributes of a deployed {@link AdvancedNumberOrder}: the object as the Telnyx API returns it.
 */
export type AdvancedNumberOrderAttributes = M_advanced_number_orders.AdvancedOrder & { id: string };

/**
 * Identifies an existing {@link AdvancedNumberOrder} for `AdvancedNumberOrder.lookup`.
 */
export interface AdvancedNumberOrderLookup {
  id: string;
}

export type AdvancedNumberOrder = Resource<
  "Telnyx.Numbers.AdvancedNumberOrder",
  AdvancedNumberOrderProps,
  AdvancedNumberOrderAttributes,
  never,
  Providers,
  AdvancedNumberOrderLookup
>;

/**
 * An advanced order for phone numbers, by country, type and features. Orders cannot be cancelled through the API.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `area_code`, `comments`, `country_code`, `customer_reference`, `features`, `phone_number_type`, `quantity`, `requirement_group_id` replaces it.
 *
 * @resource
 * @product Numbers
 */
export const AdvancedNumberOrder = Resource<AdvancedNumberOrder>(
  "Telnyx.Numbers.AdvancedNumberOrder",
);

export const AdvancedNumberOrderProvider = () =>
  Crud.provider(AdvancedNumberOrder, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "area_code",
      "comments",
      "country_code",
      "customer_reference",
      "features",
      "phone_number_type",
      "quantity",
      "requirement_group_id",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { order_id: "id" });
      return k
        ? (M_advanced_number_orders.getAdvancedOrderV2(k as any) as Effect.Effect<
            AdvancedNumberOrderAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_advanced_number_orders.createAdvancedOrderV2({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<AdvancedNumberOrderAttributes, any, any>,
    list: () =>
      Paging.all(M_advanced_number_orders.listAdvancedOrdersV2, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a AdvancedNumberOrder; it was removed from Alchemy state but still exists in your account.",
  });
