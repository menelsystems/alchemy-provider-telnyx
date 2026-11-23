// Telnyx notification channel: telnyx_notification_channel in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_notifications from "../../vendor/distilled-telnyx/src/services/notifications.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link NotificationChannel}: the create request and the update request of the Telnyx API.
 */
export type NotificationChannelProps = Omit<
  M_notifications.CreateNotificationChannelsRequest,
  "id"
> &
  Partial<Omit<M_notifications.UpdateNotificationChannelRequest, "id">>;

/**
 * Attributes of a deployed {@link NotificationChannel}: the object as the Telnyx API returns it.
 */
export type NotificationChannelAttributes = NonNullable<
  M_notifications.GetNotificationChannelResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link NotificationChannel} for `NotificationChannel.lookup`.
 */
export interface NotificationChannelLookup {
  id: string;
}

export type NotificationChannel = Resource<
  "Telnyx.Account.NotificationChannel",
  NotificationChannelProps,
  NotificationChannelAttributes,
  never,
  Providers,
  NotificationChannelLookup
>;

/**
 * A notification channel, which delivers the notifications of a notification profile by email, SMS, voice call or webhook to one destination.
 *
 * @resource
 * @product Account
 */
export const NotificationChannel = Resource<NotificationChannel>(
  "Telnyx.Account.NotificationChannel",
);

export const NotificationChannelProvider = () =>
  Crud.provider(NotificationChannel, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_notifications.getNotificationChannel(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<NotificationChannelAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_notifications.createNotificationChannels({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<NotificationChannelAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_notifications.updateNotificationChannel({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        NotificationChannelAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_notifications.deleteNotificationChannel({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_notifications.listNotificationChannels, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
