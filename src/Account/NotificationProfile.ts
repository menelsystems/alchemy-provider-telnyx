// Telnyx notification profile: telnyx_notification_profile in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_notifications from "../../vendor/distilled-telnyx/src/services/notifications.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link NotificationProfile}: the create request and the update request of the Telnyx API.
 */
export type NotificationProfileProps = Omit<
  M_notifications.CreateNotificationProfileRequest,
  "id"
> &
  Partial<Omit<M_notifications.UpdateNotificationProfileRequest, "id">>;

/**
 * Attributes of a deployed {@link NotificationProfile}: the object as the Telnyx API returns it.
 */
export type NotificationProfileAttributes = NonNullable<
  M_notifications.GetNotificationProfileResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link NotificationProfile} for `NotificationProfile.lookup`.
 */
export interface NotificationProfileLookup {
  id: string;
}

export type NotificationProfile = Resource<
  "Telnyx.Account.NotificationProfile",
  NotificationProfileProps,
  NotificationProfileAttributes,
  never,
  Providers,
  NotificationProfileLookup
>;

/**
 * A notification profile, which groups the notification channels that account notifications are sent to.
 *
 * @resource
 * @product Account
 */
export const NotificationProfile = Resource<NotificationProfile>(
  "Telnyx.Account.NotificationProfile",
);

export const NotificationProfileProvider = () =>
  Crud.provider(NotificationProfile, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_notifications.getNotificationProfile(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<NotificationProfileAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_notifications.createNotificationProfile({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<NotificationProfileAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_notifications.updateNotificationProfile({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        NotificationProfileAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_notifications.deleteNotificationProfile({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_notifications.findNotificationsProfiles,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
