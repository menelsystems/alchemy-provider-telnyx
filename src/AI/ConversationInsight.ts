// Telnyx conversation insight: telnyx_ai_conversation_insight in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_conversations from "../../vendor/distilled-telnyx/src/services/conversations.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link ConversationInsight}: the create request and the update request of the Telnyx API.
 */
export type ConversationInsightProps = Omit<
  M_conversations.CreateInsightRequest,
  "insight_id" | "idempotencyKey"
> &
  Partial<Omit<M_conversations.UpdateInsightByIdRequest, "insight_id">>;

/**
 * Attributes of a deployed {@link ConversationInsight}: the object as the Telnyx API returns it.
 */
export type ConversationInsightAttributes = NonNullable<
  M_conversations.InsightTemplateDetailRespData["data"]
> & { id: string };

/**
 * Identifies an existing {@link ConversationInsight} for `ConversationInsight.lookup`.
 */
export interface ConversationInsightLookup {
  id: string;
}

export type ConversationInsight = Resource<
  "Telnyx.AI.ConversationInsight",
  ConversationInsightProps,
  ConversationInsightAttributes,
  never,
  Providers,
  ConversationInsightLookup
>;

/**
 * An insight template, the instructions an AI model follows to extract an insight from each conversation.
 *
 * @resource
 * @product AI
 */
export const ConversationInsight = Resource<ConversationInsight>("Telnyx.AI.ConversationInsight");

export const ConversationInsightProvider = () =>
  Crud.provider(ConversationInsight, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { insight_id: "id" });
      return k
        ? (M_conversations.getInsightById(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            ConversationInsightAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_conversations.createInsight({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<ConversationInsightAttributes, any, any>,
    update: ({ current, props }) =>
      M_conversations.updateInsightById({
        ...props,
        ...Crud.path({ ...props, ...current }, { insight_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        ConversationInsightAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_conversations.deleteInsightById({
        ...Crud.path(current, { insight_id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_conversations.getAllInsights, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
