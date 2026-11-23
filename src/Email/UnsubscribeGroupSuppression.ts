// Telnyx unsubscribe group suppression: telnyx_email_unsubscribe_group_suppression in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_email_unsubscribe_groups from "#telnyx/services/email_unsubscribe_groups.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link UnsubscribeGroupSuppression}: the create request of the Telnyx API.
 */
export type UnsubscribeGroupSuppressionProps = Omit<
  M_email_unsubscribe_groups.AddGroupSuppressionRequest,
  "id" | "email"
> & {
  /**
   * The unsubscribe group.
   */
  group_id: string;
};

/**
 * Attributes of a deployed {@link UnsubscribeGroupSuppression}: the object as the Telnyx API returns it.
 */
export type UnsubscribeGroupSuppressionAttributes = NonNullable<
  M_email_unsubscribe_groups.GroupSuppressionListResponse["data"]
>[number] & { to: string };

/**
 * Identifies an existing {@link UnsubscribeGroupSuppression} for `UnsubscribeGroupSuppression.lookup`.
 */
export interface UnsubscribeGroupSuppressionLookup {
  group_id: string;
  to: string;
}

export type UnsubscribeGroupSuppression = Resource<
  "Telnyx.Email.UnsubscribeGroupSuppression",
  UnsubscribeGroupSuppressionProps,
  UnsubscribeGroupSuppressionAttributes,
  never,
  Providers,
  UnsubscribeGroupSuppressionLookup
>;

/**
 * A recipient unsubscribed from one unsubscribe group, identified by its email address.
 *
 * Changing `group_id`, `to` replaces it.
 *
 * @resource
 * @product Email
 */
export const UnsubscribeGroupSuppression = Resource<UnsubscribeGroupSuppression>(
  "Telnyx.Email.UnsubscribeGroupSuppression",
);

export const UnsubscribeGroupSuppressionProvider = () =>
  Crud.provider(UnsubscribeGroupSuppression, {
    local: ["group_id", "to"],
    stables: ["to"] as any,
    replaceOn: ["group_id", "to"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "to" });
      const parent = Crud.key(ref, { id: "group_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_email_unsubscribe_groups.listGroupSuppressions,
        { ...parent } as any,
        "page-flat",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["to"]) === id.id)),
      ) as Effect.Effect<UnsubscribeGroupSuppressionAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_email_unsubscribe_groups.addGroupSuppression({
        ...props,
        ...Crud.path(props, { id: "group_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        UnsubscribeGroupSuppressionAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_email_unsubscribe_groups.removeGroupSuppression({
        ...Crud.path(current, { id: "group_id", email: "to" }),
      } as any).pipe(Effect.asVoid),
  });
