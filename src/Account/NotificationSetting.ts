// Telnyx notification setting: telnyx_notification_setting in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_notifications from "#telnyx/services/notifications.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link NotificationSetting}: the create request of the Telnyx API.
 */
export type NotificationSettingProps = Omit<M_notifications.CreateNotificationSettingRequest, "id">;

/**
 * Attributes of a deployed {@link NotificationSetting}: the object as the Telnyx API returns it.
 */
export type NotificationSettingAttributes = NonNullable<
  M_notifications.GetNotificationSettingResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link NotificationSetting} for `NotificationSetting.lookup`.
 */
export interface NotificationSettingLookup {
  id: string;
}

export type NotificationSetting = Resource<
  "Telnyx.Account.NotificationSetting",
  NotificationSettingProps,
  NotificationSettingAttributes,
  never,
  Providers,
  NotificationSettingLookup
>;

/**
 * A notification setting, which sends a notification through a channel of a notification profile when a notification event condition is met. The API cannot change it, so every change replaces it.
 *
 * Changing `notification_channel_id`, `notification_event_condition_id`, `notification_profile_id`, `parameters` replaces it.
 *
 * @resource
 * @product Account
 */
export const NotificationSetting = Resource<NotificationSetting>(
  "Telnyx.Account.NotificationSetting",
);

export const NotificationSettingProvider = () =>
  Crud.provider(NotificationSetting, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "notification_channel_id",
      "notification_event_condition_id",
      "notification_profile_id",
      "parameters",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_notifications.getNotificationSetting(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<NotificationSettingAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_notifications.createNotificationSetting({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<NotificationSettingAttributes, any, any>,
    delete: (current) =>
      M_notifications.deleteNotificationSetting({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_notifications.listNotificationSettings, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
