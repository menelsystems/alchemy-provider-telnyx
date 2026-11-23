// Telnyx global ip health check: telnyx_global_ip_health_check in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_global_ips from "#telnyx/services/global_ips.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link GlobalIPHealthCheck}: the create request of the Telnyx API.
 */
export type GlobalIPHealthCheckProps = Omit<M_global_ips.CreateGlobalIpHealthCheckRequest, "id">;

/**
 * Attributes of a deployed {@link GlobalIPHealthCheck}: the object as the Telnyx API returns it.
 */
export type GlobalIPHealthCheckAttributes = NonNullable<
  M_global_ips.GetGlobalIpHealthCheckResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link GlobalIPHealthCheck} for `GlobalIPHealthCheck.lookup`.
 */
export interface GlobalIPHealthCheckLookup {
  id: string;
}

export type GlobalIPHealthCheck = Resource<
  "Telnyx.Networking.GlobalIPHealthCheck",
  GlobalIPHealthCheckProps,
  GlobalIPHealthCheckAttributes,
  never,
  Providers,
  GlobalIPHealthCheckLookup
>;

/**
 * A health check that Telnyx runs against a Global IP's assignments to route traffic away from unhealthy peers.
 *
 * Changing `global_ip_id`, `health_check_params`, `health_check_type` replaces it.
 *
 * @resource
 * @product Networking
 */
export const GlobalIPHealthCheck = Resource<GlobalIPHealthCheck>(
  "Telnyx.Networking.GlobalIPHealthCheck",
);

export const GlobalIPHealthCheckProvider = () =>
  Crud.provider(GlobalIPHealthCheck, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["global_ip_id", "health_check_params", "health_check_type"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_global_ips.getGlobalIpHealthCheck(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<GlobalIPHealthCheckAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_global_ips.createGlobalIpHealthCheck({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<GlobalIPHealthCheckAttributes, any, any>,
    delete: (current) =>
      M_global_ips.deleteGlobalIpHealthCheck({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_global_ips.listGlobalIpHealthChecks, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
