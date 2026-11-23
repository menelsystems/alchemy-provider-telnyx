import { NotFound } from "@distilled.cloud/core/errors";
// Telnyx spend limit: telnyx_spend_limit in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_spend_limits from "../../vendor/distilled-telnyx/src/services/spend_limits.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link SpendLimit}: the create request and the update request of the Telnyx API.
 */
export type SpendLimitProps = M_spend_limits.CreateSpendLimitRequest;

/**
 * Attributes of a deployed {@link SpendLimit}: the object as the Telnyx API returns it.
 */
export type SpendLimitAttributes = NonNullable<
  M_spend_limits.SpendLimitListResponse["data"]
>[number] & { product: string };

/**
 * Identifies an existing {@link SpendLimit} for `SpendLimit.lookup`.
 */
export interface SpendLimitLookup {
  product: string;
  period: string;
}

export type SpendLimit = Resource<
  "Telnyx.Account.SpendLimit",
  SpendLimitProps,
  SpendLimitAttributes,
  never,
  Providers,
  SpendLimitLookup
>;

/**
 * A spending cap for one product and period (daily or monthly). Set amount, or unlimited = true for explicitly no cap. When spend reaches the cap Telnyx blocks the product until the period ends. Destroy removes the limit; products with a default limit return to it.
 *
 * Changing `period`, `product` replaces it.
 *
 * @resource
 * @product Account
 */
export const SpendLimit = Resource<SpendLimit>("Telnyx.Account.SpendLimit");

// Exactly one of `amount` and `unlimited: true`: the SDK types the request
// body as that union, so the props are the create body as-is.
const body = (props: SpendLimitProps) =>
  Crud.omit(props, [
    "product",
    "period",
    "credential_id",
  ]) as M_spend_limits.UpdateSpendLimitRequest;

export const SpendLimitProvider = () =>
  Crud.provider(SpendLimit, {
    local: ["credential_id", "period", "product"],
    stables: ["product"] as any,
    replaceOn: ["period", "product", "credential_id"] as any,
    get: (ref) => {
      const product = (ref as { product?: string }).product;
      if (!product) return Effect.succeed(undefined);
      const period = (ref as { period?: string }).period ?? "daily";
      return Paging.all(M_spend_limits.listSpendLimits, {}, "none").pipe(
        Effect.map((items) =>
          items.find((it) => it.product === product && String(it.period) === period),
        ),
      ) as Effect.Effect<SpendLimitAttributes | undefined, any, any>;
    },
    normalize: (obj) => {
      // The list has an entry with limit: null for every product and period
      // without a limit: that entry means the limit is gone.
      const limit = (obj as { limit?: { amount?: unknown; unlimited?: boolean } | null }).limit;
      if (limit === null) {
        return Effect.fail(
          new NotFound({ message: "no limit is set for this product and period" }),
        );
      }
      if (limit?.unlimited === true) return Effect.succeed({ ...obj, unlimited: true });
      return Effect.succeed(limit?.amount != null ? { ...obj, amount: limit.amount } : obj);
    },
    create: (props) =>
      M_spend_limits.createSpendLimit({ body: props }).pipe(Effect.map(Crud.data)) as Effect.Effect<
        SpendLimitAttributes,
        any,
        any
      >,
    // An update replaces the limit: send amount or unlimited every time.
    update: ({ props }) =>
      M_spend_limits.updateSpendLimit({
        product: props.product,
        period: props.period,
        credential_id: (props as { credential_id?: string | null }).credential_id ?? undefined,
        body: body(props),
      }).pipe(Effect.map(Crud.data)) as Effect.Effect<SpendLimitAttributes, any, any>,
    delete: (current) =>
      M_spend_limits.deleteSpendLimit({
        product: current.product,
        period: (current as { period?: string }).period,
      } as M_spend_limits.DeleteSpendLimitRequest).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_spend_limits.listSpendLimits, {}, "none") as Effect.Effect<any, any, any>,
  });
