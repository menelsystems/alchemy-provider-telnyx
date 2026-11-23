// Telnyx sim card data usage notification: telnyx_sim_card_data_usage_notification in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_sim_cards from "../../vendor/distilled-telnyx/src/services/sim_cards.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link SIMCardDataUsageNotification}: the create request and the update request of the Telnyx API.
 */
export type SIMCardDataUsageNotificationProps = Omit<
  M_sim_cards.CreateSimCardDataUsageNotificationRequest,
  "id"
> &
  Partial<Omit<M_sim_cards.UpdateSimCardDataUsageNotificationRequest, "id">>;

/**
 * Attributes of a deployed {@link SIMCardDataUsageNotification}: the object as the Telnyx API returns it.
 */
export type SIMCardDataUsageNotificationAttributes = NonNullable<
  M_sim_cards.GetSimCardDataUsageNotificationResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link SIMCardDataUsageNotification} for `SIMCardDataUsageNotification.lookup`.
 */
export interface SIMCardDataUsageNotificationLookup {
  id: string;
}

export type SIMCardDataUsageNotification = Resource<
  "Telnyx.Wireless.SIMCardDataUsageNotification",
  SIMCardDataUsageNotificationProps,
  SIMCardDataUsageNotificationAttributes,
  never,
  Providers,
  SIMCardDataUsageNotificationLookup
>;

/**
 * Sends a notification when a SIM card's data usage reaches a threshold.
 *
 * @resource
 * @product Wireless
 */
export const SIMCardDataUsageNotification = Resource<SIMCardDataUsageNotification>(
  "Telnyx.Wireless.SIMCardDataUsageNotification",
);

export const SIMCardDataUsageNotificationProvider = () =>
  Crud.provider(SIMCardDataUsageNotification, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_sim_cards.getSimCardDataUsageNotification(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<SIMCardDataUsageNotificationAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_sim_cards.createSimCardDataUsageNotification({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        SIMCardDataUsageNotificationAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_sim_cards.updateSimCardDataUsageNotification({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        SIMCardDataUsageNotificationAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_sim_cards.deleteSimCardDataUsageNotifications({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_sim_cards.listDataUsageNotifications, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
