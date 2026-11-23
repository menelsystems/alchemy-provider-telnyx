// Telnyx profile message template: telnyx_verify_profile_message_template in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_verify from "#telnyx/services/verify.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link ProfileMessageTemplate}: the create request and the update request of the Telnyx API.
 */
export type ProfileMessageTemplateProps = Omit<
  M_verify.CreateMessageTemplateRequest,
  "template_id"
> &
  Partial<Omit<M_verify.UpdateMessageTemplateRequest, "template_id">>;

/**
 * Attributes of a deployed {@link ProfileMessageTemplate}: the object as the Telnyx API returns it.
 */
export type ProfileMessageTemplateAttributes = NonNullable<
  M_verify.ListVerifyProfileMessageTemplateResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link ProfileMessageTemplate} for `ProfileMessageTemplate.lookup`.
 */
export interface ProfileMessageTemplateLookup {
  id: string;
}

export type ProfileMessageTemplate = Resource<
  "Telnyx.Verify.ProfileMessageTemplate",
  ProfileMessageTemplateProps,
  ProfileMessageTemplateAttributes,
  never,
  Providers,
  ProfileMessageTemplateLookup
>;

/**
 * A message template for Verify codes. The Telnyx API cannot delete templates.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 *
 * @resource
 * @product Verify
 */
export const ProfileMessageTemplate = Resource<ProfileMessageTemplate>(
  "Telnyx.Verify.ProfileMessageTemplate",
);

export const ProfileMessageTemplateProvider = () =>
  Crud.provider(ProfileMessageTemplate, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, {});
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(M_verify.listProfileMessageTemplates, { ...parent } as any, "none").pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<ProfileMessageTemplateAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_verify.createMessageTemplate({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<ProfileMessageTemplateAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_verify.updateMessageTemplate({
        ...delta,
        ...Crud.path({ ...props, ...current }, { template_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        ProfileMessageTemplateAttributes,
        any,
        any
      >,
    list: () =>
      Paging.all(M_verify.listProfileMessageTemplates, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a ProfileMessageTemplate; it was removed from Alchemy state but still exists in your account.",
  });
