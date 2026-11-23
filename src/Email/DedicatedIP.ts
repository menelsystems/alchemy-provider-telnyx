// Telnyx dedicated ip: telnyx_email_dedicated_ip in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_dedicated_ips from "../../vendor/distilled-telnyx/src/services/dedicated_ips.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link DedicatedIP}: the create request of the Telnyx API.
 */
export type DedicatedIPProps = Omit<
  M_dedicated_ips.CreateDedicatedIpRequest,
  "id" | "idempotencyKey"
> & {
  /**
   * Whether destroy forces the deletion (sends `force=true` and `drain=true`), for example of an object that is in use. Destroy uses the value in state, so set it to true and apply before destroying.
   */
  force_destroy?: boolean;
};

/**
 * Attributes of a deployed {@link DedicatedIP}: the object as the Telnyx API returns it.
 */
export type DedicatedIPAttributes = NonNullable<M_dedicated_ips.DedicatedIpShowResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link DedicatedIP} for `DedicatedIP.lookup`.
 */
export interface DedicatedIPLookup {
  id: string;
}

export type DedicatedIP = Resource<
  "Telnyx.Email.DedicatedIP",
  DedicatedIPProps,
  DedicatedIPAttributes,
  never,
  Providers,
  DedicatedIPLookup
>;

/**
 * A dedicated IP address for sending email, purchased from Telnyx and billed monthly. It carries no mail until its warm-up starts (`telnyx_email_dedicated_ip_start_warmup`) and it is in an IP pool (`telnyx_email_ip_pool_ip`). Destroy releases the IP to Telnyx.
 *
 * Set `force_destroy: true` to delete it while in use.
 * Changing `ip_version`, `region` replaces it.
 *
 * @resource
 * @product Email
 */
export const DedicatedIP = Resource<DedicatedIP>("Telnyx.Email.DedicatedIP");

export const DedicatedIPProvider = () =>
  Crud.provider(DedicatedIP, {
    local: ["force_destroy", "id"],
    stables: ["id"] as any,
    replaceOn: ["ip_version", "region"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_dedicated_ips.getDedicatedIp(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            DedicatedIPAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_dedicated_ips.createDedicatedIp({
        idempotencyKey: crypto.randomUUID(),
        ...Crud.omit(props, ["force_destroy"]),
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<DedicatedIPAttributes, any, any>,
    delete: (current) =>
      M_dedicated_ips.deleteDedicatedIp({
        ...Crud.path(current, { id: "id" }),
        ...(current.force_destroy ? { force: true, drain: true } : {}),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_dedicated_ips.listDedicatedIps, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
    normalize: Hooks.goneWithStatus("released"), // released IPs stay readable until their quarantine ends,
  });
