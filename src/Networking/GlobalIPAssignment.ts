// Telnyx global ip assignment: telnyx_global_ip_assignment in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_global_ips from "#telnyx/services/global_ips.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link GlobalIPAssignment}: the create request and the update request of the Telnyx API.
 */
export type GlobalIPAssignmentProps = Omit<M_global_ips.CreateGlobalIpAssignmentRequest, "id"> &
  Partial<Omit<M_global_ips.UpdateGlobalIpAssignmentRequest, "id">>;

/**
 * Attributes of a deployed {@link GlobalIPAssignment}: the object as the Telnyx API returns it.
 */
export type GlobalIPAssignmentAttributes = NonNullable<
  M_global_ips.GetGlobalIpAssignmentResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link GlobalIPAssignment} for `GlobalIPAssignment.lookup`.
 */
export interface GlobalIPAssignmentLookup {
  id: string;
}

export type GlobalIPAssignment = Resource<
  "Telnyx.Networking.GlobalIPAssignment",
  GlobalIPAssignmentProps,
  GlobalIPAssignmentAttributes,
  never,
  Providers,
  GlobalIPAssignmentLookup
>;

/**
 * Assigns a Global IP to a WireGuard peer, so traffic to the address goes over that peer's tunnel. Assignment completes in the background.
 *
 * Changing `global_ip_id`, `wireguard_peer_id` replaces it.
 *
 * @resource
 * @product Networking
 */
export const GlobalIPAssignment = Resource<GlobalIPAssignment>(
  "Telnyx.Networking.GlobalIPAssignment",
);

export const GlobalIPAssignmentProvider = () =>
  Crud.provider(GlobalIPAssignment, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["global_ip_id", "wireguard_peer_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_global_ips.getGlobalIpAssignment(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<GlobalIPAssignmentAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_global_ips.createGlobalIpAssignment({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<GlobalIPAssignmentAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_global_ips.updateGlobalIpAssignment({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        GlobalIPAssignmentAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_global_ips.deleteGlobalIpAssignment({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_global_ips.listGlobalIpAssignments, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
