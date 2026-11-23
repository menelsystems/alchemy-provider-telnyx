// Telnyx mobile voice connection: telnyx_mobile_voice_connection in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_mobile_voice_connections from "#telnyx/services/mobile_voice_connections.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link MobileVoiceConnection}: the create request and the update request of the Telnyx API.
 */
export type MobileVoiceConnectionProps = Omit<
  M_mobile_voice_connections.CreateMobileVoiceConnectionRequest,
  "id"
> &
  Partial<Omit<M_mobile_voice_connections.UpdateMobileVoiceConnectionRequest, "id">>;

/**
 * Attributes of a deployed {@link MobileVoiceConnection}: the object as the Telnyx API returns it.
 */
export type MobileVoiceConnectionAttributes = NonNullable<
  M_mobile_voice_connections.GetMobileVoiceConnectionResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link MobileVoiceConnection} for `MobileVoiceConnection.lookup`.
 */
export interface MobileVoiceConnectionLookup {
  id: string;
}

export type MobileVoiceConnection = Resource<
  "Telnyx.Voice.MobileVoiceConnection",
  MobileVoiceConnectionProps,
  MobileVoiceConnectionAttributes,
  never,
  Providers,
  MobileVoiceConnectionLookup
>;

/**
 * A connection for voice on Telnyx mobile SIM cards.
 *
 * @resource
 * @product Voice
 */
export const MobileVoiceConnection = Resource<MobileVoiceConnection>(
  "Telnyx.Voice.MobileVoiceConnection",
);

export const MobileVoiceConnectionProvider = () =>
  Crud.provider(MobileVoiceConnection, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_mobile_voice_connections.getMobileVoiceConnection(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<MobileVoiceConnectionAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_mobile_voice_connections.createMobileVoiceConnection({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        MobileVoiceConnectionAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_mobile_voice_connections.updateMobileVoiceConnection({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        MobileVoiceConnectionAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_mobile_voice_connections.deleteMobileVoiceConnection({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_mobile_voice_connections.listMobileVoiceConnections,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
