// Telnyx assistant: telnyx_ai_assistant in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_assistants from "#telnyx/services/assistants.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Assistant}: the create request and the update request of the Telnyx API.
 */
export type AssistantProps = Omit<
  M_assistants.CreateNewAssistantPublicAssistantsPostRequest,
  "assistant_id" | "idempotencyKey"
> &
  Partial<Omit<M_assistants.UpdateAssistantPublicAssistantsAssistantIdPostRequest, "assistant_id">>;

/**
 * Attributes of a deployed {@link Assistant}: the object as the Telnyx API returns it.
 */
export type AssistantAttributes = M_assistants.InferenceEmbeddingAssistant & { id: string };

/**
 * Identifies an existing {@link Assistant} for `Assistant.lookup`.
 */
export interface AssistantLookup {
  id: string;
}

export type Assistant = Resource<
  "Telnyx.AI.Assistant",
  AssistantProps,
  AssistantAttributes,
  never,
  Providers,
  AssistantLookup
>;

/**
 * An AI assistant that handles voice calls, messages and web chats.
 *
 * @resource
 * @product AI
 */
export const Assistant = Resource<Assistant>("Telnyx.AI.Assistant");

export const AssistantProvider = () =>
  Crud.provider(Assistant, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { assistant_id: "id" });
      return k
        ? (M_assistants.getAssistantPublicAssistantsAssistantIdGet(k as any) as Effect.Effect<
            AssistantAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_assistants.createNewAssistantPublicAssistantsPost({
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<AssistantAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_assistants.updateAssistantPublicAssistantsAssistantIdPost({
        ...delta,
        ...Crud.path({ ...props, ...current }, { assistant_id: "id" }),
      } as any) as Effect.Effect<AssistantAttributes, any, any>,
    delete: (current) =>
      M_assistants.deleteAssistantPublicAssistantsAssistantIdDelete({
        ...Crud.path(current, { assistant_id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_assistants.getAssistantsPublicAssistantsGet, {} as any, "none") as Effect.Effect<
        any,
        any,
        any
      >,
  });
