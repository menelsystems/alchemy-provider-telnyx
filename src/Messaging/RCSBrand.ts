// Telnyx rcs brand: telnyx_rcs_brand in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_rcs_brands from "#telnyx/services/rcs_brands.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link RCSBrand}: the create request and the update request of the Telnyx API.
 */
export type RCSBrandProps = Omit<M_rcs_brands.CreateRcsBrandRequest, "id"> &
  Partial<Omit<M_rcs_brands.UpdateRcsBrandRequest, "id">>;

/**
 * Attributes of a deployed {@link RCSBrand}: the object as the Telnyx API returns it.
 */
export type RCSBrandAttributes = M_rcs_brands.BrandResponse & { brand_id: string };

/**
 * Identifies an existing {@link RCSBrand} for `RCSBrand.lookup`.
 */
export interface RCSBrandLookup {
  brand_id: string;
}

export type RCSBrand = Resource<
  "Telnyx.Messaging.RCSBrand",
  RCSBrandProps,
  RCSBrandAttributes,
  never,
  Providers,
  RCSBrandLookup
>;

/**
 * An RCS brand, the verified business under which RCS agents are registered. The API cannot delete brands, so destroy only removes the brand from Alchemy state.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 *
 * @resource
 * @product Messaging
 */
export const RCSBrand = Resource<RCSBrand>("Telnyx.Messaging.RCSBrand");

export const RCSBrandProvider = () =>
  Crud.provider(RCSBrand, {
    local: ["brand_id"],
    stables: ["brand_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "brand_id" });
      return k
        ? (M_rcs_brands.getRcsBrand(k as any) as Effect.Effect<RCSBrandAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_rcs_brands.createRcsBrand({ ...props, ...Crud.path(props, {}) } as any) as Effect.Effect<
        RCSBrandAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_rcs_brands.updateRcsBrand({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "brand_id" }),
      } as any) as Effect.Effect<RCSBrandAttributes, any, any>,
    list: () =>
      Paging.all(M_rcs_brands.listRcsBrands, {} as any, "none") as Effect.Effect<any, any, any>,
    retain: () =>
      "The Telnyx API cannot delete RCS brands. The brand was removed from Alchemy state but still exists in your Telnyx account.",
  });
