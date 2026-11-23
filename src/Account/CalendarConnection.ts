// Telnyx calendar connection: telnyx_calendar_connection in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_meeting_calendar_connections from "#telnyx/services/meeting_calendar_connections.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link CalendarConnection}: the create request of the Telnyx API.
 */
export type CalendarConnectionProps = Omit<
  M_meeting_calendar_connections.UpdateMeetingCalendarConnectionRequest,
  "id"
> & {
  /**
   * The calendar connection id.
   */
  calendar_connection_id: string;
  /**
   * Whether destroy deletes the object in Telnyx. By default destroy only removes it from Terraform state. Destroy uses the value in state, so set it to true and apply before destroying.
   */
  release_on_destroy?: boolean;
};

/**
 * Attributes of a deployed {@link CalendarConnection}: the object as the Telnyx API returns it.
 */
export type CalendarConnectionAttributes = NonNullable<
  M_meeting_calendar_connections.CalendarConnectionResponse["data"]
> & { calendar_connection_id: string };

/**
 * Identifies an existing {@link CalendarConnection} for `CalendarConnection.lookup`.
 */
export interface CalendarConnectionLookup {
  calendar_connection_id: string;
}

export type CalendarConnection = Resource<
  "Telnyx.Account.CalendarConnection",
  CalendarConnectionProps,
  CalendarConnectionAttributes,
  never,
  Providers,
  CalendarConnectionLookup
>;

/**
 * Policy and defaults for a meeting bot calendar connection (Google Calendar or Microsoft Outlook), applied to sessions created for future meetings. A connection is created by completing calendar OAuth in a browser, so create adopts a connection that already exists. Destroy only removes it from Alchemy state unless `release_on_destroy` is true, in which case it disconnects the calendar.
 *
 * Destroy keeps it in your account unless `release_on_destroy: true`.
 * Changing `calendar_connection_id` replaces it.
 *
 * @resource
 * @product Account
 */
export const CalendarConnection = Resource<CalendarConnection>("Telnyx.Account.CalendarConnection");

export const CalendarConnectionProvider = () =>
  Crud.provider(CalendarConnection, {
    local: ["calendar_connection_id", "release_on_destroy"],
    stables: ["calendar_connection_id"] as any,
    replaceOn: ["calendar_connection_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "calendar_connection_id" });
      return k
        ? (M_meeting_calendar_connections.getMeetingCalendarConnection(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<CalendarConnectionAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_meeting_calendar_connections.updateMeetingCalendarConnection({
        ...Crud.omit(props, ["calendar_connection_id", "release_on_destroy"]),
        ...Crud.path(props, { id: "calendar_connection_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        CalendarConnectionAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_meeting_calendar_connections.updateMeetingCalendarConnection({
        ...Crud.omit(delta, ["calendar_connection_id", "release_on_destroy"]),
        ...Crud.path({ ...props, ...current }, { id: "calendar_connection_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        CalendarConnectionAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_meeting_calendar_connections.disconnectMeetingCalendar({
        ...Crud.path(current, { id: "calendar_connection_id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_meeting_calendar_connections.listMeetingCalendarConnections,
        {} as any,
        "none",
      ) as Effect.Effect<any, any, any>,
    retain: (props) =>
      props.release_on_destroy
        ? undefined
        : "The calendar connection was removed from Alchemy state but is still connected in Telnyx. Set release_on_destroy: true to disconnect it on destroy.",
  });
