// Telnyx inbox: telnyx_email_inbox in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_email_inboxes from "../../vendor/distilled-telnyx/src/services/email_inboxes.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Inbox}: the create request of the Telnyx API.
 */
export type InboxProps = Omit<M_email_inboxes.CreateEmailInboxRequest, "id">;

/**
 * Attributes of a deployed {@link Inbox}: the object as the Telnyx API returns it.
 */
export type InboxAttributes = NonNullable<M_email_inboxes.EmailInboxResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Inbox} for `Inbox.lookup`.
 */
export interface InboxLookup {
  id: string;
}

export type Inbox = Resource<
  "Telnyx.Email.Inbox",
  InboxProps,
  InboxAttributes,
  never,
  Providers,
  InboxLookup
>;

/**
 * An inbox that receives email on an inbound-enabled domain, or on the account's shared inbound subdomain when `domain_id` is not set. The Telnyx API soft-deletes inboxes: after destroy the address stays reserved.
 *
 * Changing `domain_id`, `username` replaces it.
 *
 * @resource
 * @product Email
 */
export const Inbox = Resource<Inbox>("Telnyx.Email.Inbox");

export const InboxProvider = () =>
  Crud.provider(Inbox, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["domain_id", "username"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_email_inboxes.getEmailInbox(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            InboxAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_email_inboxes.createEmailInbox({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<InboxAttributes, any, any>,
    delete: (current) =>
      M_email_inboxes.deleteEmailInbox({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_email_inboxes.listEmailInboxes, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
    normalize: (obj) => {
      // Takes a username, answers only with the full address.
      const address = String((obj as any).address ?? "");
      const at = address.lastIndexOf("@");
      return Effect.succeed(at > 0 ? Hooks.withField(obj, "username", address.slice(0, at)) : obj);
    },
  });
