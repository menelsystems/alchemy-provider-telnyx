// Telnyx conversation insight group assignment: telnyx_ai_conversation_insight_group_assignment in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_conversations from "../../vendor/distilled-telnyx/src/services/conversations.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link ConversationInsightGroupAssignment}: the create request of the Telnyx API.
 */
export type ConversationInsightGroupAssignmentProps = Omit<
  M_conversations.AssignInsightToGroupRequest,
  "group_id" | "insight_id"
> & {
  /**
   * The group id.
   */
  group_id: string;
  /**
   * The insight id.
   */
  insight_id: string;
};

/**
 * Attributes of a deployed {@link ConversationInsightGroupAssignment}: the object as the Telnyx API returns it.
 */
export type ConversationInsightGroupAssignmentAttributes = Record<string, unknown> & {
  insight_id: string;
};

/**
 * Identifies an existing {@link ConversationInsightGroupAssignment} for `ConversationInsightGroupAssignment.lookup`.
 */
export interface ConversationInsightGroupAssignmentLookup {
  group_id: string;
  insight_id: string;
}

export type ConversationInsightGroupAssignment = Resource<
  "Telnyx.AI.ConversationInsightGroupAssignment",
  ConversationInsightGroupAssignmentProps,
  ConversationInsightGroupAssignmentAttributes,
  never,
  Providers,
  ConversationInsightGroupAssignmentLookup
>;

/**
 * The assignment of an insight template to an insight group.
 *
 * Changing `group_id`, `insight_id` replaces it.
 *
 * @resource
 * @product AI
 */
export const ConversationInsightGroupAssignment = Resource<ConversationInsightGroupAssignment>(
  "Telnyx.AI.ConversationInsightGroupAssignment",
);

export const ConversationInsightGroupAssignmentProvider = () =>
  Crud.provider(ConversationInsightGroupAssignment, {
    local: ["group_id", "insight_id"],
    stables: ["insight_id"] as any,
    replaceOn: ["group_id", "insight_id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "insight_id" });
      const k = Crud.key(ref, { group_id: "group_id" });
      if (!id || !k) return Effect.succeed(undefined);
      return M_conversations.getInsightGroupById(k as any).pipe(
        Effect.map((res: any) => {
          const parent = res?.data ?? {};
          const found = (parent["insights"] ?? []).find((el: any) => String(el?.["id"]) === id.id);
          return found === undefined ? undefined : found;
        }),
      ) as any;
    },
    create: (props) =>
      M_conversations.assignInsightToGroup({
        ...Crud.omit(props, ["group_id", "insight_id"]),
        ...Crud.path(props, { group_id: "group_id", insight_id: "insight_id" }),
      } as any) as Effect.Effect<any, any, any>,
    delete: (current) =>
      M_conversations.unassignInsightFromGroup({
        ...Crud.path(current, { group_id: "group_id", insight_id: "insight_id" }),
      } as any).pipe(Effect.asVoid),
  });
