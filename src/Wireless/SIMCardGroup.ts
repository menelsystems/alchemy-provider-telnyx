// Telnyx sim card group: telnyx_sim_card_group in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_sim_card_groups from "../../vendor/distilled-telnyx/src/services/sim_card_groups.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link SIMCardGroup}: the create request and the update request of the Telnyx API.
 */
export type SIMCardGroupProps = Omit<M_sim_card_groups.CreateSimCardGroupRequest, "id"> &
  Partial<Omit<M_sim_card_groups.UpdateSimCardGroupRequest, "id">> & {
    /** The private wireless gateway the group's SIMs use. Removing it detaches the gateway. */
    private_wireless_gateway_id?: string;
    /** The wireless blocklist applied to the group. Removing it detaches the blocklist. */
    wireless_blocklist_id?: string;
  };

/**
 * Attributes of a deployed {@link SIMCardGroup}: the object as the Telnyx API returns it.
 */
export type SIMCardGroupAttributes = NonNullable<
  M_sim_card_groups.GetSimCardGroupResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link SIMCardGroup} for `SIMCardGroup.lookup`.
 */
export interface SIMCardGroupLookup {
  id: string;
}

export type SIMCardGroup = Resource<
  "Telnyx.Wireless.SIMCardGroup",
  SIMCardGroupProps,
  SIMCardGroupAttributes,
  never,
  Providers,
  SIMCardGroupLookup
>;

/**
 * A group of SIM cards that share a data limit, a private wireless gateway and a wireless blocklist.
 *
 * @resource
 * @product Wireless
 */
export const SIMCardGroup = Resource<SIMCardGroup>("Telnyx.Wireless.SIMCardGroup");

export const SIMCardGroupProvider = () =>
  Crud.provider(SIMCardGroup, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_sim_card_groups.getSimCardGroup(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            SIMCardGroupAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_sim_card_groups.createSimCardGroup({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<SIMCardGroupAttributes, any, any>,
    // The gateway and blocklist are attached and detached by actions.
    update: ({ current, delta }) =>
      Effect.gen(function* () {
        const {
          private_wireless_gateway_id: pwg,
          wireless_blocklist_id: blocklist,
          ...rest
        } = delta;
        if (Object.keys(rest).length > 0) {
          yield* M_sim_card_groups.updateSimCardGroup({ ...rest, id: current.id } as any);
        }
        if (pwg !== undefined) {
          yield* pwg === null
            ? M_sim_card_groups.removeSimCardGroupPrivateWirelessGateway({ id: current.id })
            : M_sim_card_groups.setPrivateWirelessGatewayForSimCardGroup({
                id: current.id,
                private_wireless_gateway_id: pwg,
              });
        }
        if (blocklist !== undefined) {
          yield* blocklist === null
            ? M_sim_card_groups.removeWirelessBlocklistForSimCardGroup({ id: current.id })
            : M_sim_card_groups.setWirelessBlocklistForSimCardGroup({
                id: current.id,
                wireless_blocklist_id: blocklist,
              });
        }
      }),
    delete: (current) =>
      M_sim_card_groups.deleteSimCardGroup({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_sim_card_groups.getAllSimCardGroups, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
