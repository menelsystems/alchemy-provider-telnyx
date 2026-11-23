// Telnyx enterprise: telnyx_enterprise in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_enterprises from "../../vendor/distilled-telnyx/src/services/enterprises.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Enterprise}: the create request and the update request of the Telnyx API.
 */
export type EnterpriseProps = Omit<M_enterprises.CreateEnterpriseRequest, "enterprise_id"> &
  Partial<Omit<M_enterprises.UpdateEnterpriseRequest, "enterprise_id">>;

/**
 * Attributes of a deployed {@link Enterprise}: the object as the Telnyx API returns it.
 */
export type EnterpriseAttributes = NonNullable<M_enterprises.EnterprisePublicWrapped["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Enterprise} for `Enterprise.lookup`.
 */
export interface EnterpriseLookup {
  id: string;
}

export type Enterprise = Resource<
  "Telnyx.Compliance.Enterprise",
  EnterpriseProps,
  EnterpriseAttributes,
  never,
  Providers,
  EnterpriseLookup
>;

/**
 * An enterprise: the business behind Branded Calling and phone number reputation, with its legal details, contacts and addresses.
 *
 * Changing `country_code`, `organization_type`, `role_type` replaces it.
 *
 * @resource
 * @product Compliance
 */
export const Enterprise = Resource<Enterprise>("Telnyx.Compliance.Enterprise");

export const EnterpriseProvider = () =>
  Crud.provider(Enterprise, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["country_code", "organization_type", "role_type"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { enterprise_id: "id" });
      return k
        ? (M_enterprises.getEnterprise(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            EnterpriseAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_enterprises.createEnterprise({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<EnterpriseAttributes, any, any>,
    update: ({ current, props }) =>
      M_enterprises.updateEnterprise({
        ...props,
        ...Crud.path({ ...props, ...current }, { enterprise_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<EnterpriseAttributes, any, any>,
    delete: (current) =>
      M_enterprises.deleteEnterprise({
        ...Crud.path(current, { enterprise_id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_enterprises.listEnterprises, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
