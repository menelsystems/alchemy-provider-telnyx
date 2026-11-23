// Telnyx domain: telnyx_email_domain in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_email_domains from "#telnyx/services/email_domains.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Domain}: the create request and the update request of the Telnyx API.
 */
export type DomainProps = Omit<M_email_domains.CreateEmailDomainRequest, "id"> &
  Partial<Omit<M_email_domains.UpdateEmailDomainRequest, "id">> & {
    /**
     * Whether destroy forces the deletion (sends `force=true`), for example of an object that is in use. Destroy uses the value in state, so set it to true and apply before destroying.
     */
    force_destroy?: boolean;
  };

/**
 * Attributes of a deployed {@link Domain}: the object as the Telnyx API returns it.
 */
export type DomainAttributes = NonNullable<M_email_domains.EmailDomainResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Domain} for `Domain.lookup`.
 */
export interface DomainLookup {
  id: string;
}

export type Domain = Resource<
  "Telnyx.Email.Domain",
  DomainProps,
  DomainAttributes,
  never,
  Providers,
  DomainLookup
>;

/**
 * A domain for sending email and, optionally, receiving it. The DNS records to publish are in `dns_records` and in the `telnyx_email_domain_dns_records` data source; verify them with the `telnyx_email_domain_verify` action.
 *
 * Set `force_destroy: true` to delete it while in use.
 * Changing `domain` replaces it.
 *
 * @resource
 * @product Email
 */
export const Domain = Resource<Domain>("Telnyx.Email.Domain");

export const DomainProvider = () =>
  Crud.provider(Domain, {
    local: ["force_destroy", "id"],
    stables: ["id"] as any,
    replaceOn: ["domain"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_email_domains.getEmailDomain(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            DomainAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_email_domains.createEmailDomain({
        ...Crud.omit(props, ["force_destroy"]),
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<DomainAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_email_domains.updateEmailDomain({
        ...Crud.omit(delta, ["force_destroy"]),
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<DomainAttributes, any, any>,
    delete: (current) =>
      M_email_domains.deleteEmailDomain({
        ...Crud.path(current, { id: "id" }),
        ...(current.force_destroy ? { force: true } : {}),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_email_domains.listEmailDomains, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    normalize: (obj) =>
      // Takes inbound_enabled, answers with inbound.enabled.
      Effect.succeed(
        typeof (obj as any).inbound?.enabled === "boolean"
          ? Hooks.withField(obj, "inbound_enabled", (obj as any).inbound.enabled)
          : obj,
      ),
  });
