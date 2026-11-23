// Telnyx suppression: telnyx_email_suppression in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_email_suppressions from "../../vendor/distilled-telnyx/src/services/email_suppressions.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Suppression}: the create request of the Telnyx API.
 */
export type SuppressionProps = Omit<M_email_suppressions.CreateEmailBlockRequest, "id">;

/**
 * Attributes of a deployed {@link Suppression}: the object as the Telnyx API returns it.
 */
export type SuppressionAttributes = NonNullable<M_email_suppressions.EmailBlockResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Suppression} for `Suppression.lookup`.
 */
export interface SuppressionLookup {
  id: string;
}

export type Suppression = Resource<
  "Telnyx.Email.Suppression",
  SuppressionProps,
  SuppressionAttributes,
  never,
  Providers,
  SuppressionLookup
>;

/**
 * A manual block that stops email to a recipient, for the whole account or, with `domain_id` or `from`, for one domain or sender. Telnyx also adds suppressions for bounces, complaints and unsubscribes; read them with `telnyx_email_suppressions`.
 *
 * Changing `domain_id`, `expires_at`, `from`, `to` replaces it.
 *
 * @resource
 * @product Email
 */
export const Suppression = Resource<Suppression>("Telnyx.Email.Suppression");

export const SuppressionProvider = () =>
  Crud.provider(Suppression, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["domain_id", "expires_at", "from", "to"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_email_suppressions.getEmailBlock(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<SuppressionAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_email_suppressions.createEmailBlock({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<SuppressionAttributes, any, any>,
    delete: (current) =>
      M_email_suppressions.deleteEmailBlock({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_email_suppressions.listEmailBlocks, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    normalize: Hooks.goneWithStatus("removed"), // removed suppressions stay readable,
  });
