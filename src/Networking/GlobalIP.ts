// Telnyx global ip: telnyx_global_ip in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_global_ips from "#telnyx/services/global_ips.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link GlobalIP}: the create request of the Telnyx API.
 */
export type GlobalIPProps = Omit<M_global_ips.CreateGlobalIpRequest, "id">;

/**
 * Attributes of a deployed {@link GlobalIP}: the object as the Telnyx API returns it.
 */
export type GlobalIPAttributes = NonNullable<M_global_ips.GetGlobalIpResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link GlobalIP} for `GlobalIP.lookup`.
 */
export interface GlobalIPLookup {
  id: string;
}

export type GlobalIP = Resource<
  "Telnyx.Networking.GlobalIP",
  GlobalIPProps,
  GlobalIPAttributes,
  never,
  Providers,
  GlobalIPLookup
>;

/**
 * A Global IP: an anycast address that delivers traffic to the WireGuard peers it is assigned to.
 *
 * Changing `description`, `name`, `ports` replaces it.
 *
 * @resource
 * @product Networking
 */
export const GlobalIP = Resource<GlobalIP>("Telnyx.Networking.GlobalIP");

export const GlobalIPProvider = () =>
  Crud.provider(GlobalIP, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["description", "name", "ports"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_global_ips.getGlobalIp(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            GlobalIPAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_global_ips.createGlobalIp({ ...props, ...Crud.path(props, {}) } as any) as Effect.Effect<
        GlobalIPAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_global_ips.deleteGlobalIp({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_global_ips.listGlobalIps, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
