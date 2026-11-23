// Telnyx virtual cross connect: telnyx_virtual_cross_connect in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_virtual_cross_connects from "../../vendor/distilled-telnyx/src/services/virtual_cross_connects.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link VirtualCrossConnect}: the create request and the update request of the Telnyx API.
 */
export type VirtualCrossConnectProps = Omit<
  M_virtual_cross_connects.CreateVirtualCrossConnectRequest,
  "id"
> &
  Partial<Omit<M_virtual_cross_connects.UpdateVirtualCrossConnectRequest, "id">>;

/**
 * Attributes of a deployed {@link VirtualCrossConnect}: the object as the Telnyx API returns it.
 */
export type VirtualCrossConnectAttributes = NonNullable<
  M_virtual_cross_connects.GetVirtualCrossConnectResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link VirtualCrossConnect} for `VirtualCrossConnect.lookup`.
 */
export interface VirtualCrossConnectLookup {
  id: string;
}

export type VirtualCrossConnect = Resource<
  "Telnyx.Networking.VirtualCrossConnect",
  VirtualCrossConnectProps,
  VirtualCrossConnectAttributes,
  never,
  Providers,
  VirtualCrossConnectLookup
>;

/**
 * A virtual cross connect between a network and a cloud provider (AWS, Azure or Google Cloud) over BGP.
 *
 * Changing `bandwidth_mbps`, `bgp_asn`, `cloud_provider`, `cloud_provider_region`, `name`, `network_id`, `primary_bgp_key`, `primary_cloud_account_id`, `primary_telnyx_ip`, `region_code`, `secondary_bgp_key`, `secondary_cloud_account_id`, `secondary_telnyx_ip` replaces it.
 *
 * @resource
 * @product Networking
 */
export const VirtualCrossConnect = Resource<VirtualCrossConnect>(
  "Telnyx.Networking.VirtualCrossConnect",
);

export const VirtualCrossConnectProvider = () =>
  Crud.provider(VirtualCrossConnect, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: [
      "bandwidth_mbps",
      "bgp_asn",
      "cloud_provider",
      "cloud_provider_region",
      "name",
      "network_id",
      "primary_bgp_key",
      "primary_cloud_account_id",
      "primary_telnyx_ip",
      "region_code",
      "secondary_bgp_key",
      "secondary_cloud_account_id",
      "secondary_telnyx_ip",
    ] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_virtual_cross_connects.getVirtualCrossConnect(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<VirtualCrossConnectAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_virtual_cross_connects.createVirtualCrossConnect({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        VirtualCrossConnectAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_virtual_cross_connects.updateVirtualCrossConnect({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        VirtualCrossConnectAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_virtual_cross_connects.deleteVirtualCrossConnect({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_virtual_cross_connects.listVirtualCrossConnects,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
