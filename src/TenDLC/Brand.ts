// Telnyx brand: telnyx_10dlc_brand in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_brands from "#telnyx/services/brands.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Brand}: the create request and the update request of the Telnyx API.
 */
export type BrandProps = Omit<M_brands.CreateBrandPostRequest, "brandId"> &
  Partial<Omit<M_brands.UpdateBrandRequest, "brandId">>;

/**
 * Attributes of a deployed {@link Brand}: the object as the Telnyx API returns it.
 */
export type BrandAttributes = M_brands.GetBrandResponse & { brandId: string };

/**
 * Identifies an existing {@link Brand} for `Brand.lookup`.
 */
export interface BrandLookup {
  brandId: string;
}

export type Brand = Resource<
  "Telnyx.TenDLC.Brand",
  BrandProps,
  BrandAttributes,
  never,
  Providers,
  BrandLookup
>;

/**
 * A 10DLC brand: the company or person registered with The Campaign Registry (TCR) to send A2P SMS from US 10-digit long code numbers. Each brand registration has an up-front, non-refundable fee, and a brand cannot be deleted while it has active campaigns or campaigns deactivated less than three months ago.
 *
 * Changing `mobilePhone`, `mock` replaces it.
 *
 * @resource
 * @product TenDLC
 */
export const Brand = Resource<Brand>("Telnyx.TenDLC.Brand");

export const BrandProvider = () =>
  Crud.provider(Brand, {
    local: ["brandId"],
    stables: ["brandId"] as any,
    replaceOn: ["mobilePhone", "mock"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { brandId: "brandId" });
      return k
        ? (M_brands.getBrand(k as any) as Effect.Effect<BrandAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_brands.createBrandPost({ ...props, ...Crud.path(props, {}) } as any) as Effect.Effect<
        BrandAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_brands.updateBrand({
        ...props,
        ...Crud.path({ ...props, ...current }, { brandId: "brandId" }),
      } as any) as Effect.Effect<BrandAttributes, any, any>,
    delete: (current) =>
      M_brands.deleteBrand({ ...Crud.path(current, { brandId: "brandId" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_brands.getBrands, {} as any, "page-records") as Effect.Effect<any, any, any>,
  });
