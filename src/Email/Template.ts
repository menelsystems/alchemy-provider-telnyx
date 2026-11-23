// Telnyx template: telnyx_email_template in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_email_templates from "../../vendor/distilled-telnyx/src/services/email_templates.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Template}: the create request and the update request of the Telnyx API.
 */
export type TemplateProps = Omit<
  M_email_templates.CreateEmailTemplateRequest,
  "id" | "idempotencyKey"
> &
  Partial<Omit<M_email_templates.UpdateEmailTemplateRequest, "id">>;

/**
 * Attributes of a deployed {@link Template}: the object as the Telnyx API returns it.
 */
export type TemplateAttributes = NonNullable<M_email_templates.EmailTemplateResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link Template} for `Template.lookup`.
 */
export interface TemplateLookup {
  id: string;
}

export type Template = Resource<
  "Telnyx.Email.Template",
  TemplateProps,
  TemplateAttributes,
  never,
  Providers,
  TemplateLookup
>;

/**
 * An email template, written in Liquid, for the subject and the HTML and text bodies of messages.
 *
 * @resource
 * @product Email
 */
export const Template = Resource<Template>("Telnyx.Email.Template");

export const TemplateProvider = () =>
  Crud.provider(Template, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_email_templates.getEmailTemplate(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<TemplateAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_email_templates.createEmailTemplate({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<TemplateAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_email_templates.updateEmailTemplate({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<TemplateAttributes, any, any>,
    delete: (current) =>
      M_email_templates.deleteEmailTemplate({ ...Crud.path(current, { id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_email_templates.listEmailTemplates, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
  });
