// Telnyx fqdn: telnyx_fqdn in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_fqdns from "#telnyx/services/fqdns.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link FQDN}: the create request and the update request of the Telnyx API.
 */
export type FQDNProps = Omit<M_fqdns.CreateFqdnRequest, "id"> &
  Partial<Omit<M_fqdns.UpdateFqdnRequest, "id">>;

/**
 * Attributes of a deployed {@link FQDN}: the object as the Telnyx API returns it.
 */
export type FQDNAttributes = NonNullable<M_fqdns.GetFqdnResponse["data"]> & { id: string };

/**
 * Identifies an existing {@link FQDN} for `FQDN.lookup`.
 */
export interface FQDNLookup {
  id: string;
}

export type FQDN = Resource<
  "Telnyx.Voice.FQDN",
  FQDNProps,
  FQDNAttributes,
  never,
  Providers,
  FQDNLookup
>;

/**
 * A fully qualified domain name that an FQDN connection sends SIP traffic to.
 *
 * @resource
 * @product Voice
 */
export const FQDN = Resource<FQDN>("Telnyx.Voice.FQDN");

export const FQDNProvider = () =>
  Crud.provider(FQDN, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_fqdns.getFqdn(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            FQDNAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_fqdns.createFqdn({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<FQDNAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_fqdns.updateFqdn({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<FQDNAttributes, any, any>,
    delete: (current) =>
      M_fqdns.deleteFqdn({ ...Crud.path(current, { id: "id" }) } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_fqdns.listFqdns, {} as any, "page-flat") as Effect.Effect<any, any, any>,
  });
