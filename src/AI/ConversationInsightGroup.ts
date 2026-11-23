// Telnyx conversation insight group: telnyx_ai_conversation_insight_group in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_conversations from "../../vendor/distilled-telnyx/src/services/conversations.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link ConversationInsightGroup}: the create request and the update request of the Telnyx API.
 */
export type ConversationInsightGroupProps = Omit<
  M_conversations.CreateInsightGroupRequest,
  "group_id" | "idempotencyKey"
> &
  Partial<Omit<M_conversations.UpdateInsightGroupByIdRequest, "group_id">>;

/**
 * Attributes of a deployed {@link ConversationInsightGroup}: the object as the Telnyx API returns it.
 */
export type ConversationInsightGroupAttributes = NonNullable<
  M_conversations.InsightTemplateGroupDetailRespData["data"]
> & { id: string };

/**
 * Identifies an existing {@link ConversationInsightGroup} for `ConversationInsightGroup.lookup`.
 */
export interface ConversationInsightGroupLookup {
  id: string;
}

export type ConversationInsightGroup = Resource<
  "Telnyx.AI.ConversationInsightGroup",
  ConversationInsightGroupProps,
  ConversationInsightGroupAttributes,
  never,
  Providers,
  ConversationInsightGroupLookup
>;

/**
 * A group of insight templates that AI assistants run on their conversations.
 *
 * @resource
 * @product AI
 */
export const ConversationInsightGroup = Resource<ConversationInsightGroup>(
  "Telnyx.AI.ConversationInsightGroup",
);

export const ConversationInsightGroupProvider = () =>
  Crud.provider(ConversationInsightGroup, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { group_id: "id" });
      return k
        ? (M_conversations.getInsightGroupById(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<ConversationInsightGroupAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_conversations.createInsightGroup({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<ConversationInsightGroupAttributes, any, any>,
    update: ({ current, props }) =>
      M_conversations.updateInsightGroupById({
        ...props,
        ...Crud.path({ ...props, ...current }, { group_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        ConversationInsightGroupAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_conversations.deleteInsightGroupById({
        ...Crud.path(current, { group_id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_conversations.getAllInsightGroups, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
