// Telnyx ip: telnyx_ip in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ips from "#telnyx/services/ips.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link IP}: the create request and the update request of the Telnyx API.
 */
export type IPProps = Omit<M_ips.CreateIpRequest, "id"> &
  Partial<Omit<M_ips.UpdateIpRequest, "id">>;

/**
 * Attributes of a deployed {@link IP}: the object as the Telnyx API returns it.
 */
export type IPAttributes = NonNullable<M_ips.GetIpResponse["data"]> & { id: string };

/**
 * Identifies an existing {@link IP} for `IP.lookup`.
 */
export interface IPLookup {
  id: string;
}

export type IP = Resource<"Telnyx.Voice.IP", IPProps, IPAttributes, never, Providers, IPLookup>;

/**
 * An IP address and port that an IP connection accepts SIP traffic from.
 *
 * @resource
 * @product Voice
 */
export const IP = Resource<IP>("Telnyx.Voice.IP");

export const IPProvider = () =>
  Crud.provider(IP, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_ips.getIp(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            IPAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ips.createIp({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<IPAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_ips.updateIp({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<IPAttributes, any, any>,
    delete: (current) =>
      M_ips.deleteIp({ ...Crud.path(current, { id: "id" }) } as any).pipe(Effect.asVoid),
    list: () => Paging.all(M_ips.listIps, {} as any, "page-flat") as Effect.Effect<any, any, any>,
  });
