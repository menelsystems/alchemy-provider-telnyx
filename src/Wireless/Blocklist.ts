// Telnyx blocklist: telnyx_wireless_blocklist in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_wireless_blocklists from "../../vendor/distilled-telnyx/src/services/wireless_blocklists.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Blocklist}: the create request and the update request of the Telnyx API.
 */
export type BlocklistProps = Omit<M_wireless_blocklists.CreateWirelessBlocklistRequest, "id"> &
  Partial<Omit<M_wireless_blocklists.UpdateWirelessBlocklistRequest, "id">>;

/**
 * Attributes of a deployed {@link Blocklist}: the object as the Telnyx API returns it.
 */
export type BlocklistAttributes = NonNullable<
  M_wireless_blocklists.GetWirelessBlocklistResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link Blocklist} for `Blocklist.lookup`.
 */
export interface BlocklistLookup {
  id: string;
}

export type Blocklist = Resource<
  "Telnyx.Wireless.Blocklist",
  BlocklistProps,
  BlocklistAttributes,
  never,
  Providers,
  BlocklistLookup
>;

/**
 * A wireless blocklist of countries, MCCs or PLMNs that SIM cards of a group may not roam on.
 *
 * Changing `type` replaces it.
 *
 * @resource
 * @product Wireless
 */
export const Blocklist = Resource<Blocklist>("Telnyx.Wireless.Blocklist");

export const BlocklistProvider = () =>
  Crud.provider(Blocklist, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["type"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_wireless_blocklists.getWirelessBlocklist(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<BlocklistAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_wireless_blocklists.createWirelessBlocklist({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<BlocklistAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_wireless_blocklists.updateWirelessBlocklist({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any) as Effect.Effect<BlocklistAttributes, any, any>,
    delete: (current) =>
      M_wireless_blocklists.deleteWirelessBlocklist({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_wireless_blocklists.getWirelessBlocklistsGateways,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
