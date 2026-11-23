// Telnyx sim card order: telnyx_sim_card_order in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_sim_card_orders from "#telnyx/services/sim_card_orders.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link SIMCardOrder}: the create request of the Telnyx API.
 */
export type SIMCardOrderProps = Omit<M_sim_card_orders.CreateSimCardOrderRequest, "id">;

/**
 * Attributes of a deployed {@link SIMCardOrder}: the object as the Telnyx API returns it.
 */
export type SIMCardOrderAttributes = NonNullable<
  M_sim_card_orders.GetSimCardOrderResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link SIMCardOrder} for `SIMCardOrder.lookup`.
 */
export interface SIMCardOrderLookup {
  id: string;
}

export type SIMCardOrder = Resource<
  "Telnyx.Wireless.SIMCardOrder",
  SIMCardOrderProps,
  SIMCardOrderAttributes,
  never,
  Providers,
  SIMCardOrderLookup
>;

/**
 * An order for physical SIM cards shipped to an address. Orders cannot be cancelled: destroy removes the order from state.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `address_id`, `quantity` replaces it.
 *
 * @resource
 * @product Wireless
 */
export const SIMCardOrder = Resource<SIMCardOrder>("Telnyx.Wireless.SIMCardOrder");

export const SIMCardOrderProvider = () =>
  Crud.provider(SIMCardOrder, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["address_id", "quantity"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_sim_card_orders.getSimCardOrder(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            SIMCardOrderAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_sim_card_orders.createSimCardOrder({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<SIMCardOrderAttributes, any, any>,
    list: () =>
      Paging.all(M_sim_card_orders.getSimCardOrders, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a SIMCardOrder; it was removed from Alchemy state but still exists in your account.",
    normalize: (obj) =>
      // Created with address_id, answers with order_address.
      Effect.succeed(
        (obj as any).order_address?.id != null
          ? Hooks.withField(obj, "address_id", (obj as any).order_address.id)
          : obj,
      ),
  });
