// Telnyx assistant tag: telnyx_ai_assistant_tag in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_assistants from "#telnyx/services/assistants.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AssistantTag}: the create request of the Telnyx API.
 */
export type AssistantTagProps = Omit<
  M_assistants.AddAssistantTagRequest,
  "assistant_id" | "tag"
> & {
  /**
   * The assistant id.
   */
  assistant_id: string;
  /**
   * The tag.
   */
  tag: string;
};

/**
 * Attributes of a deployed {@link AssistantTag}: the object as the Telnyx API returns it.
 */
export type AssistantTagAttributes = Record<string, unknown> & { tag: string };

/**
 * Identifies an existing {@link AssistantTag} for `AssistantTag.lookup`.
 */
export interface AssistantTagLookup {
  assistant_id: string;
  tag: string;
}

export type AssistantTag = Resource<
  "Telnyx.AI.AssistantTag",
  AssistantTagProps,
  AssistantTagAttributes,
  never,
  Providers,
  AssistantTagLookup
>;

/**
 * One tag on an AI assistant. Do not also set `tags` on the same `telnyx_ai_assistant`, or the two will undo each other's changes.
 *
 * Changing `assistant_id`, `tag` replaces it.
 *
 * @resource
 * @product AI
 */
export const AssistantTag = Resource<AssistantTag>("Telnyx.AI.AssistantTag");

export const AssistantTagProvider = () =>
  Crud.provider(AssistantTag, {
    local: ["assistant_id", "tag"],
    stables: ["tag"] as any,
    replaceOn: ["assistant_id", "tag"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "tag" });
      const k = Crud.key(ref, { assistant_id: "assistant_id" });
      if (!id || !k) return Effect.succeed(undefined);
      return M_assistants.getAssistantPublicAssistantsAssistantIdGet(k as any).pipe(
        Effect.map((res: any) => {
          const parent = res ?? {};
          const found = (parent["tags"] ?? []).find((el: any) => String(el) === id.id);
          return found === undefined ? undefined : { tag: found };
        }),
      ) as any;
    },
    create: (props) =>
      M_assistants.addAssistantTag({
        ...Crud.omit(props, ["assistant_id"]),
        ...Crud.path(props, { assistant_id: "assistant_id" }),
      } as any) as Effect.Effect<any, any, any>,
    delete: (current) =>
      M_assistants.removeAssistantTag({
        ...Crud.path(current, { assistant_id: "assistant_id", tag: "tag" }),
      } as any).pipe(Effect.asVoid),
  });
