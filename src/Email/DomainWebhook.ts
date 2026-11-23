// Telnyx domain webhook: telnyx_email_domain_webhook in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_email_webhooks from "#telnyx/services/email_webhooks.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link DomainWebhook}: the create request and the update request of the Telnyx API.
 */
export type DomainWebhookProps = Omit<
  M_email_webhooks.CreateEmailDomainWebhookRequest,
  "domain_id" | "id"
> &
  Partial<Omit<M_email_webhooks.UpdateEmailDomainWebhookRequest, "domain_id" | "id">> & {
    /**
     * The email domain the webhook belongs to.
     */
    domain_id: string;
  };

/**
 * Attributes of a deployed {@link DomainWebhook}: the object as the Telnyx API returns it.
 */
export type DomainWebhookAttributes = NonNullable<M_email_webhooks.EmailWebhookResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link DomainWebhook} for `DomainWebhook.lookup`.
 */
export interface DomainWebhookLookup {
  domain_id: string;
  id: string;
}

export type DomainWebhook = Resource<
  "Telnyx.Email.DomainWebhook",
  DomainWebhookProps,
  DomainWebhookAttributes,
  never,
  Providers,
  DomainWebhookLookup
>;

/**
 * A webhook that receives the events of an email domain, such as deliveries, bounces and verification changes.
 *
 * Changing `domain_id` replaces it.
 *
 * @resource
 * @product Email
 */
export const DomainWebhook = Resource<DomainWebhook>("Telnyx.Email.DomainWebhook");

export const DomainWebhookProvider = () =>
  Crud.provider(DomainWebhook, {
    local: ["domain_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["domain_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { domain_id: "domain_id", id: "id" });
      return k
        ? (M_email_webhooks.getEmailDomainWebhook(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<DomainWebhookAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_email_webhooks.createEmailDomainWebhook({
        ...props,
        ...Crud.path(props, { domain_id: "domain_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<DomainWebhookAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_email_webhooks.updateEmailDomainWebhook({
        ...delta,
        ...Crud.path({ ...props, ...current }, { domain_id: "domain_id", id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<DomainWebhookAttributes, any, any>,
    delete: (current) =>
      M_email_webhooks.deleteEmailDomainWebhook({
        ...Crud.path(current, { domain_id: "domain_id", id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
