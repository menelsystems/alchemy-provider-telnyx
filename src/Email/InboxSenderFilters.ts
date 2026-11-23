// Telnyx inbox sender filters: telnyx_email_inbox_sender_filters in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_email_inboxes from "#telnyx/services/email_inboxes.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link InboxSenderFilters}: the create request of the Telnyx API.
 */
export type InboxSenderFiltersProps = Omit<
  M_email_inboxes.ReplaceEmailInboxFiltersRequest,
  "inbox_id"
> & {
  /**
   * The inbox id.
   */
  inbox_id: string;
};

/**
 * Attributes of a deployed {@link InboxSenderFilters}: the object as the Telnyx API returns it.
 */
export type InboxSenderFiltersAttributes = NonNullable<
  M_email_inboxes.InboxFiltersResponse["data"]
> & { inbox_id: string };

/**
 * Identifies an existing {@link InboxSenderFilters} for `InboxSenderFilters.lookup`.
 */
export interface InboxSenderFiltersLookup {
  inbox_id: string;
}

export type InboxSenderFilters = Resource<
  "Telnyx.Email.InboxSenderFilters",
  InboxSenderFiltersProps,
  InboxSenderFiltersAttributes,
  never,
  Providers,
  InboxSenderFiltersLookup
>;

/**
 * The sender allowlist and blocklist of an email inbox. Alchemy manages both lists as a whole. The Telnyx API cannot delete them: destroy removes them from Alchemy state and leaves them on the inbox.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `inbox_id` replaces it.
 *
 * @resource
 * @product Email
 */
export const InboxSenderFilters = Resource<InboxSenderFilters>("Telnyx.Email.InboxSenderFilters");

export const InboxSenderFiltersProvider = () =>
  Crud.provider(InboxSenderFilters, {
    local: ["inbox_id"],
    stables: ["inbox_id"] as any,
    replaceOn: ["inbox_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { inbox_id: "inbox_id" });
      return k
        ? (M_email_inboxes.listEmailInboxFilters(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<InboxSenderFiltersAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_email_inboxes.replaceEmailInboxFilters({
        ...Crud.omit(props, ["inbox_id"]),
        ...Crud.path(props, { inbox_id: "inbox_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        InboxSenderFiltersAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_email_inboxes.replaceEmailInboxFilters({
        ...Crud.omit(props, ["inbox_id"]),
        ...Crud.path({ ...props, ...current }, { inbox_id: "inbox_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        InboxSenderFiltersAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a InboxSenderFilters; it was removed from Alchemy state but still exists in your account.",
  });
