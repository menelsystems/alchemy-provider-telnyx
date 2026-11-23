// Telnyx message template: telnyx_whatsapp_message_template in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_whatsapp_message_templates from "#telnyx/services/whatsapp_message_templates.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link MessageTemplate}: the create request and the update request of the Telnyx API.
 */
export type MessageTemplateProps = Omit<
  M_whatsapp_message_templates.PostWhatsappTemplateRequest2,
  "id"
> &
  Partial<Omit<M_whatsapp_message_templates.PatchWhatsappTemplateRequest2, "id">>;

/**
 * Attributes of a deployed {@link MessageTemplate}: the object as the Telnyx API returns it.
 */
export type MessageTemplateAttributes = NonNullable<
  M_whatsapp_message_templates.GetWhatsappTemplateResponse2["data"]
> & { id: string };

/**
 * Identifies an existing {@link MessageTemplate} for `MessageTemplate.lookup`.
 */
export interface MessageTemplateLookup {
  id: string;
}

export type MessageTemplate = Resource<
  "Telnyx.WhatsApp.MessageTemplate",
  MessageTemplateProps,
  MessageTemplateAttributes,
  never,
  Providers,
  MessageTemplateLookup
>;

/**
 * A WhatsApp message template of a WhatsApp Business Account. Templates are reviewed by Meta after create and after each change; status shows the outcome, and only approved templates can be used to start conversations.
 *
 * Changing `language`, `name`, `waba_id` replaces it.
 *
 * @resource
 * @product WhatsApp
 */
export const MessageTemplate = Resource<MessageTemplate>("Telnyx.WhatsApp.MessageTemplate");

export const MessageTemplateProvider = () =>
  Crud.provider(MessageTemplate, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["language", "name", "waba_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_whatsapp_message_templates.getWhatsappTemplate2(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<MessageTemplateAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_whatsapp_message_templates.postWhatsappTemplate2({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<MessageTemplateAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_whatsapp_message_templates.patchWhatsappTemplate2({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<MessageTemplateAttributes, any, any>,
    delete: (current) =>
      M_whatsapp_message_templates.deleteWhatsappTemplate2({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_whatsapp_message_templates.listWhatsappTemplates2,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
    normalize: (obj) =>
      // Created with waba_id, read back as whatsapp_business_account.id.
      Effect.succeed(
        "waba_id" in (obj as object) || (obj as any).whatsapp_business_account?.id === undefined
          ? obj
          : Hooks.withField(obj, "waba_id", (obj as any).whatsapp_business_account.id),
      ),
  });
