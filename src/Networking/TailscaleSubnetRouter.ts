// Telnyx tailscale subnet router: telnyx_tailscale_subnet_router in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_tailscale_subnet_routers from "../../vendor/distilled-telnyx/src/services/tailscale_subnet_routers.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TailscaleSubnetRouter}: the create request and the update request of the Telnyx API.
 */
export type TailscaleSubnetRouterProps = Omit<
  M_tailscale_subnet_routers.CreateTailscaleSubnetRouterRequest,
  "id"
> &
  Partial<Omit<M_tailscale_subnet_routers.UpdateTailscaleSubnetRouterRequest, "id">>;

/**
 * Attributes of a deployed {@link TailscaleSubnetRouter}: the object as the Telnyx API returns it.
 */
export type TailscaleSubnetRouterAttributes = NonNullable<
  M_tailscale_subnet_routers.GetTailscaleSubnetRouterResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link TailscaleSubnetRouter} for `TailscaleSubnetRouter.lookup`.
 */
export interface TailscaleSubnetRouterLookup {
  id: string;
}

export type TailscaleSubnetRouter = Resource<
  "Telnyx.Networking.TailscaleSubnetRouter",
  TailscaleSubnetRouterProps,
  TailscaleSubnetRouterAttributes,
  never,
  Providers,
  TailscaleSubnetRouterLookup
>;

/**
 * A Tailscale subnet router on a network that advertises the network's routes to your tailnet. Create enrolls it with a Tailscale auth key.
 *
 * Changing `network_id`, `region_code` replaces it.
 *
 * @resource
 * @product Networking
 */
export const TailscaleSubnetRouter = Resource<TailscaleSubnetRouter>(
  "Telnyx.Networking.TailscaleSubnetRouter",
);

export const TailscaleSubnetRouterProvider = () =>
  Crud.provider(TailscaleSubnetRouter, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["network_id", "region_code"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_tailscale_subnet_routers.getTailscaleSubnetRouter(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<TailscaleSubnetRouterAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_tailscale_subnet_routers.createTailscaleSubnetRouter({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        TailscaleSubnetRouterAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_tailscale_subnet_routers.updateTailscaleSubnetRouter({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        TailscaleSubnetRouterAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_tailscale_subnet_routers.deleteTailscaleSubnetRouter({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_tailscale_subnet_routers.listTailscaleSubnetRouters,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
