// Telnyx billing group: telnyx_billing_group in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_billing_groups from "../../vendor/distilled-telnyx/src/services/billing_groups.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link BillingGroup}: the create request and the update request of the Telnyx API.
 */
export type BillingGroupProps = Omit<M_billing_groups.CreateBillingGroupRequest, "id"> &
  Partial<Omit<M_billing_groups.UpdateBillingGroupRequest, "id">>;

/**
 * Attributes of a deployed {@link BillingGroup}: the object as the Telnyx API returns it.
 */
export type BillingGroupAttributes = NonNullable<
  M_billing_groups.GetBillingGroupResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link BillingGroup} for `BillingGroup.lookup`.
 */
export interface BillingGroupLookup {
  id: string;
}

export type BillingGroup = Resource<
  "Telnyx.Account.BillingGroup",
  BillingGroupProps,
  BillingGroupAttributes,
  never,
  Providers,
  BillingGroupLookup
>;

/**
 * A billing group, which groups phone numbers and other usage on invoices.
 *
 * @resource
 * @product Account
 */
export const BillingGroup = Resource<BillingGroup>("Telnyx.Account.BillingGroup");

export const BillingGroupProvider = () =>
  Crud.provider(BillingGroup, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_billing_groups.getBillingGroup(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            BillingGroupAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_billing_groups.createBillingGroup({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<BillingGroupAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_billing_groups.updateBillingGroup({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<BillingGroupAttributes, any, any>,
    delete: (current) =>
      M_billing_groups.deleteBillingGroup({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_billing_groups.listBillingGroups, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
