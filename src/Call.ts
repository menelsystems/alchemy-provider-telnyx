/**
 * Run a Telnyx API operation as part of a deploy.
 *
 * Wraps alchemy's own `Action` primitive: the call runs during deploy
 * whenever its resolved input changes (inputs may be Outputs of other
 * resources), and its result is an Output for downstream resources. This is
 * how the one-shot operations Terraform models as actions — revetting a
 * 10DLC brand, starting an IP warm-up, submitting a porting order — fit a
 * stack. Any of the SDK's ~1,550 operations works.
 *
 * @example
 * ```ts
 * import * as Brands from "alchemy-provider-telnyx/api/brands";
 *
 * const brand = yield* Telnyx.TenDLC.Brand("Brand", { ... });
 * yield* Telnyx.Call("RevetBrand", Brands.revetBrand, { brandId: brand.brandId });
 * ```
 */
import { Action } from "alchemy/Action";
import type { Input } from "alchemy/Input";
import type * as Effect from "effect/Effect";

export const Call = <I extends object, O, E, R>(
  id: string,
  operation: (input: I) => Effect.Effect<O, E, R>,
  input: { [K in keyof I]: Input<I[K]> },
) => Action<"Telnyx.Call", I, O, R>("Telnyx.Call", (resolved: I) => operation(resolved))(id, input);
