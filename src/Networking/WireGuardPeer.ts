// Telnyx wireguard peer: telnyx_wireguard_peer in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_wire_guard_interfaces from "../../vendor/distilled-telnyx/src/services/wire_guard_interfaces.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link WireGuardPeer}: the create request and the update request of the Telnyx API.
 */
export type WireGuardPeerProps = Omit<M_wire_guard_interfaces.CreateWireguardPeerRequest, "id"> &
  Partial<Omit<M_wire_guard_interfaces.UpdateWireguardPeerRequest, "id">>;

/**
 * Attributes of a deployed {@link WireGuardPeer}: the object as the Telnyx API returns it.
 */
export type WireGuardPeerAttributes = NonNullable<
  M_wire_guard_interfaces.GetWireguardPeerResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link WireGuardPeer} for `WireGuardPeer.lookup`.
 */
export interface WireGuardPeerLookup {
  id: string;
}

export type WireGuardPeer = Resource<
  "Telnyx.Networking.WireGuardPeer",
  WireGuardPeerProps,
  WireGuardPeerAttributes,
  never,
  Providers,
  WireGuardPeerLookup
>;

/**
 * A WireGuard peer of a WireGuard interface. When public_key is not set, Telnyx generates a key pair and returns the private key only on create; it is kept in state as a sensitive value.
 *
 * Changing `public_key`, `wireguard_interface_id` replaces it.
 *
 * @resource
 * @product Networking
 */
export const WireGuardPeer = Resource<WireGuardPeer>("Telnyx.Networking.WireGuardPeer");

export const WireGuardPeerProvider = () =>
  Crud.provider(WireGuardPeer, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["public_key", "wireguard_interface_id"] as any,
    preserve: ["private_key"],
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_wire_guard_interfaces.getWireguardPeer(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<WireGuardPeerAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_wire_guard_interfaces.createWireguardPeer({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<WireGuardPeerAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_wire_guard_interfaces.updateWireguardPeer({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<WireGuardPeerAttributes, any, any>,
    delete: (current) =>
      M_wire_guard_interfaces.deleteWireguardPeer({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_wire_guard_interfaces.listWireguardPeers,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
