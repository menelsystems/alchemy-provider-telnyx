// Telnyx access ip range: telnyx_access_ip_range in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ip_ranges from "#telnyx/services/ip_ranges.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AccessIPRange}: the create request of the Telnyx API.
 */
export type AccessIPRangeProps = Omit<M_ip_ranges.CreateAccessIPRangeRequest, "access_ip_range_id">;

/**
 * Attributes of a deployed {@link AccessIPRange}: the object as the Telnyx API returns it.
 */
export type AccessIPRangeAttributes = NonNullable<
  M_ip_ranges.AccessIPRangeListResponseSchema["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link AccessIPRange} for `AccessIPRange.lookup`.
 */
export interface AccessIPRangeLookup {
  id: string;
}

export type AccessIPRange = Resource<
  "Telnyx.Account.AccessIPRange",
  AccessIPRangeProps,
  AccessIPRangeAttributes,
  never,
  Providers,
  AccessIPRangeLookup
>;

/**
 * A CIDR block allowed to reach the Telnyx API and portal for your account. Read from the list of ranges, because the API has no single-range read.
 *
 * Changing `cidr_block`, `description` replaces it.
 *
 * @resource
 * @product Account
 */
export const AccessIPRange = Resource<AccessIPRange>("Telnyx.Account.AccessIPRange");

export const AccessIPRangeProvider = () =>
  Crud.provider(AccessIPRange, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["cidr_block", "description"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, {});
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(M_ip_ranges.listAccessIpRanges, { ...parent } as any, "page-flat").pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<AccessIPRangeAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_ip_ranges.createAccessIPRange({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<AccessIPRangeAttributes, any, any>,
    delete: (current) =>
      M_ip_ranges.deleteAccessIpRange({
        ...Crud.path(current, { access_ip_range_id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_ip_ranges.listAccessIpRanges, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
