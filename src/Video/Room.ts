// Telnyx room: telnyx_room in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_rooms from "../../vendor/distilled-telnyx/src/services/rooms.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Room}: the create request and the update request of the Telnyx API.
 */
export type RoomProps = Omit<M_rooms.CreateRoomRequest, "room_id"> &
  Partial<Omit<M_rooms.UpdateRoomRequest, "room_id">>;

/**
 * Attributes of a deployed {@link Room}: the object as the Telnyx API returns it.
 */
export type RoomAttributes = NonNullable<M_rooms.ViewRoomResponse["data"]> & { id: string };

/**
 * Identifies an existing {@link Room} for `Room.lookup`.
 */
export interface RoomLookup {
  id: string;
}

export type Room = Resource<
  "Telnyx.Video.Room",
  RoomProps,
  RoomAttributes,
  never,
  Providers,
  RoomLookup
>;

/**
 * A video room that participants join with the Telnyx Video SDK.
 *
 * @resource
 * @product Video
 */
export const Room = Resource<Room>("Telnyx.Video.Room");

export const RoomProvider = () =>
  Crud.provider(Room, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { room_id: "id" });
      return k
        ? (M_rooms.viewRoom(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            RoomAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_rooms.createRoom({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<RoomAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_rooms.updateRoom({
        ...delta,
        ...Crud.path({ ...props, ...current }, { room_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<RoomAttributes, any, any>,
    delete: (current) =>
      M_rooms.deleteRoom({ ...Crud.path(current, { room_id: "id" }) } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_rooms.listRooms, {} as any, "page-flat") as Effect.Effect<any, any, any>,
  });
