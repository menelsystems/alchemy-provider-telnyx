// Telnyx requirement group: telnyx_requirement_group in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_requirement_groups from "#telnyx/services/requirement_groups.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link RequirementGroup}: the create request and the update request of the Telnyx API.
 */
export type RequirementGroupProps = Omit<M_requirement_groups.CreateRequirementGroupRequest, "id"> &
  Partial<Omit<M_requirement_groups.UpdateRequirementGroupRequest, "id">>;

/**
 * Attributes of a deployed {@link RequirementGroup}: the object as the Telnyx API returns it.
 */
export type RequirementGroupAttributes = M_requirement_groups.RequirementGroup & { id: string };

/**
 * Identifies an existing {@link RequirementGroup} for `RequirementGroup.lookup`.
 */
export interface RequirementGroupLookup {
  id: string;
}

export type RequirementGroup = Resource<
  "Telnyx.Compliance.RequirementGroup",
  RequirementGroupProps,
  RequirementGroupAttributes,
  never,
  Providers,
  RequirementGroupLookup
>;

/**
 * A group of answers to the regulatory requirements of phone numbers in a country.
 *
 * Changing `action`, `country_code`, `phone_number_type` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const RequirementGroup = Resource<RequirementGroup>("Telnyx.Compliance.RequirementGroup");

export const RequirementGroupProvider = () =>
  Crud.provider(RequirementGroup, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["action", "country_code", "phone_number_type"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_requirement_groups.getRequirementGroup(k as any) as Effect.Effect<
            RequirementGroupAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_requirement_groups.createRequirementGroup({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<RequirementGroupAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_requirement_groups.updateRequirementGroup({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any) as Effect.Effect<RequirementGroupAttributes, any, any>,
    delete: (current) =>
      M_requirement_groups.deleteRequirementGroup({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_requirement_groups.getRequirementGroups, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
  });
