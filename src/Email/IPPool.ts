// Telnyx ip pool: telnyx_email_ip_pool in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ip_pools from "#telnyx/services/ip_pools.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link IPPool}: the create request and the update request of the Telnyx API.
 */
export type IPPoolProps = Omit<M_ip_pools.CreateIpPoolRequest, "id"> &
  Partial<Omit<M_ip_pools.UpdateIpPoolRequest, "id">> & {
    /**
     * Whether destroy forces the deletion (sends `force=true` and `drain=true`), for example of an object that is in use. Destroy uses the value in state, so set it to true and apply before destroying.
     */
    force_destroy?: boolean;
  };

/**
 * Attributes of a deployed {@link IPPool}: the object as the Telnyx API returns it.
 */
export type IPPoolAttributes = NonNullable<M_ip_pools.IpPoolShowResponse["data"]> & { id: string };

/**
 * Identifies an existing {@link IPPool} for `IPPool.lookup`.
 */
export interface IPPoolLookup {
  id: string;
}

export type IPPool = Resource<
  "Telnyx.Email.IPPool",
  IPPoolProps,
  IPPoolAttributes,
  never,
  Providers,
  IPPoolLookup
>;

/**
 * A pool of dedicated IPs that carries the mail of one email domain (`domain_id`) or, as the account default (`is_default`), of every domain without a pool of its own.
 *
 * Set `force_destroy: true` to delete it while in use.
 *
 * @resource
 * @product Email
 */
export const IPPool = Resource<IPPool>("Telnyx.Email.IPPool");

export const IPPoolProvider = () =>
  Crud.provider(IPPool, {
    local: ["force_destroy", "id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_ip_pools.getIpPool(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            IPPoolAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ip_pools.createIpPool({
        ...Crud.omit(props, ["force_destroy"]),
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<IPPoolAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_ip_pools.updateIpPool({
        ...Crud.omit(delta, ["force_destroy"]),
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<IPPoolAttributes, any, any>,
    delete: (current) =>
      M_ip_pools.deleteIpPool({
        ...Crud.path(current, { id: "id" }),
        ...(current.force_destroy ? { force: true, drain: true } : {}),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_ip_pools.listIpPools, {} as any, "none") as Effect.Effect<any, any, any>,
  });
