// Telnyx ip pool ip: telnyx_email_ip_pool_ip in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ip_pools from "../../vendor/distilled-telnyx/src/services/ip_pools.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link IPPoolIP}: the create request of the Telnyx API.
 */
export type IPPoolIPProps = Omit<M_ip_pools.AddIpToPoolRequest, "id" | "ip_id"> & {
  /**
   * Whether destroy forces the deletion (sends `force=true` and `drain=true`), for example of an object that is in use. Destroy uses the value in state, so set it to true and apply before destroying.
   */
  force_destroy?: boolean;
  /**
   * The IP pool.
   */
  pool_id: string;
};

/**
 * Attributes of a deployed {@link IPPoolIP}: the object as the Telnyx API returns it.
 */
export type IPPoolIPAttributes = Record<string, unknown> & { dedicated_ip_id: string };

/**
 * Identifies an existing {@link IPPoolIP} for `IPPoolIP.lookup`.
 */
export interface IPPoolIPLookup {
  pool_id: string;
  dedicated_ip_id: string;
}

export type IPPoolIP = Resource<
  "Telnyx.Email.IPPoolIP",
  IPPoolIPProps,
  IPPoolIPAttributes,
  never,
  Providers,
  IPPoolIPLookup
>;

/**
 * A dedicated IP's membership of an IP pool. An IP is in at most one pool; destroy takes it out of the pool and keeps the IP.
 *
 * Set `force_destroy: true` to delete it while in use.
 * Changing `dedicated_ip_id`, `pool_id`, `weight` replaces it.
 *
 * @resource
 * @product Email
 */
export const IPPoolIP = Resource<IPPoolIP>("Telnyx.Email.IPPoolIP");

export const IPPoolIPProvider = () =>
  Crud.provider(IPPoolIP, {
    local: ["dedicated_ip_id", "force_destroy", "pool_id"],
    stables: ["dedicated_ip_id"] as any,
    replaceOn: ["dedicated_ip_id", "pool_id", "weight"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "dedicated_ip_id" });
      const k = Crud.key(ref, { id: "pool_id" });
      if (!id || !k) return Effect.succeed(undefined);
      return M_ip_pools.getIpPool(k as any).pipe(
        Effect.map((res: any) => {
          const parent = res?.data ?? {};
          const found = (parent["ips"] ?? []).find((el: any) => String(el?.["id"]) === id.id);
          return found === undefined ? undefined : found;
        }),
      ) as any;
    },
    create: (props) =>
      M_ip_pools.addIpToPool({
        ...Crud.omit(props, ["force_destroy"]),
        ...Crud.path(props, { id: "pool_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<any, any, any>,
    delete: (current) =>
      M_ip_pools.removeIpFromPool({
        ...Crud.path(current, { id: "pool_id", ip_id: "dedicated_ip_id" }),
        ...(current.force_destroy ? { force: true, drain: true } : {}),
      } as any).pipe(Effect.asVoid),
  });
