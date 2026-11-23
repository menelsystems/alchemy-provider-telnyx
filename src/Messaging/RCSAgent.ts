// Telnyx rcs agent: telnyx_rcs_agent in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_rcs_agents from "../../vendor/distilled-telnyx/src/services/rcs_agents.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link RCSAgent}: the create request and the update request of the Telnyx API.
 */
export type RCSAgentProps = Omit<M_rcs_agents.CreateRcsAgentRequest, "id" | "idempotencyKey"> &
  Partial<Omit<M_rcs_agents.UpdateRcsAgentRequest, "id">>;

/**
 * Attributes of a deployed {@link RCSAgent}: the object as the Telnyx API returns it.
 */
export type RCSAgentAttributes = M_rcs_agents.AgentResponse & { agent_id: string };

/**
 * Identifies an existing {@link RCSAgent} for `RCSAgent.lookup`.
 */
export interface RCSAgentLookup {
  agent_id: string;
}

export type RCSAgent = Resource<
  "Telnyx.Messaging.RCSAgent",
  RCSAgentProps,
  RCSAgentAttributes,
  never,
  Providers,
  RCSAgentLookup
>;

/**
 * An RCS agent, the branded sender of RCS business messages, registered under an RCS brand. The API cannot delete agents, so destroy only removes the agent from Alchemy state.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `brand_id` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const RCSAgent = Resource<RCSAgent>("Telnyx.Messaging.RCSAgent");

export const RCSAgentProvider = () =>
  Crud.provider(RCSAgent, {
    local: ["agent_id"],
    stables: ["agent_id"] as any,
    replaceOn: ["brand_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "agent_id" });
      return k
        ? (M_rcs_agents.getRcsAgent(k as any) as Effect.Effect<RCSAgentAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_rcs_agents.createRcsAgent({
        idempotencyKey: crypto.randomUUID(),
        ...props,
        ...Crud.path(props, {}),
      } as any) as Effect.Effect<RCSAgentAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_rcs_agents.updateRcsAgent({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "agent_id" }),
      } as any) as Effect.Effect<RCSAgentAttributes, any, any>,
    list: () =>
      Paging.all(M_rcs_agents.listRcsAgents, {} as any, "none") as Effect.Effect<any, any, any>,
    retain: () =>
      "The Telnyx API cannot delete RCS agents. The agent was removed from Alchemy state but still exists in your Telnyx account.",
  });
