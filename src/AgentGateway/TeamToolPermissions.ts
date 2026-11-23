// Telnyx team tool permissions: telnyx_agent_gateway_team_tool_permissions in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateway_tool_permissions from "../../vendor/distilled-telnyx/src/services/agent_gateway_tool_permissions.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TeamToolPermissions}: the create request of the Telnyx API.
 */
export type TeamToolPermissionsProps = Omit<
  M_agent_gateway_tool_permissions.SetAgentGatewayTeamToolPermissionsRequest,
  "instance_id" | "team_id"
> & {
  /**
   * The gateway id.
   */
  gateway_id: string;
  /**
   * The team id.
   */
  team_id: string;
};

/**
 * Attributes of a deployed {@link TeamToolPermissions}: the object as the Telnyx API returns it.
 */
export type TeamToolPermissionsAttributes = NonNullable<
  M_agent_gateway_tool_permissions.AgentGatewayToolPermissionsResponse["data"]
> & { team_id: string };

/**
 * Identifies an existing {@link TeamToolPermissions} for `TeamToolPermissions.lookup`.
 */
export interface TeamToolPermissionsLookup {
  gateway_id: string;
  team_id: string;
}

export type TeamToolPermissions = Resource<
  "Telnyx.AgentGateway.TeamToolPermissions",
  TeamToolPermissionsProps,
  TeamToolPermissionsAttributes,
  never,
  Providers,
  TeamToolPermissionsLookup
>;

/**
 * The MCP servers and APIs, and their tools, that an Agent Gateway team may call. Each apply replaces the whole grant; destroy grants none.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `gateway_id`, `team_id` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const TeamToolPermissions = Resource<TeamToolPermissions>(
  "Telnyx.AgentGateway.TeamToolPermissions",
);

export const TeamToolPermissionsProvider = () =>
  Crud.provider(TeamToolPermissions, {
    local: ["gateway_id", "team_id"],
    stables: ["team_id"] as any,
    replaceOn: ["gateway_id", "team_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { instance_id: "gateway_id", team_id: "team_id" });
      return k
        ? (M_agent_gateway_tool_permissions.getAgentGatewayTeamToolPermissions(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<TeamToolPermissionsAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_agent_gateway_tool_permissions.setAgentGatewayTeamToolPermissions({
        ...Crud.omit(props, ["gateway_id", "team_id"]),
        ...Crud.path(props, { instance_id: "gateway_id", team_id: "team_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        TeamToolPermissionsAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_agent_gateway_tool_permissions.setAgentGatewayTeamToolPermissions({
        ...Crud.omit(props, ["gateway_id", "team_id"]),
        ...Crud.path({ ...props, ...current }, { instance_id: "gateway_id", team_id: "team_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        TeamToolPermissionsAttributes,
        any,
        any
      >,
    delete: (current) =>
      // A grant the API only replaces: destroy grants none.
      M_agent_gateway_tool_permissions.setAgentGatewayTeamToolPermissions({
        servers: [],
        ...Crud.path(current, { instance_id: "gateway_id", team_id: "team_id" }),
      } as any).pipe(Effect.asVoid),
  });
