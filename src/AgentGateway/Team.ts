// Telnyx team: telnyx_agent_gateway_team in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateway_teams from "../../vendor/distilled-telnyx/src/services/agent_gateway_teams.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Team}: the create request and the update request of the Telnyx API.
 */
export type TeamProps = Omit<
  M_agent_gateway_teams.CreateAgentGatewayTeamRequest,
  "instance_id" | "team_id"
> &
  Partial<Omit<M_agent_gateway_teams.UpdateAgentGatewayTeamRequest, "instance_id" | "team_id">> & {
    /**
     * The gateway id.
     */
    gateway_id: string;
  };

/**
 * Attributes of a deployed {@link Team}: the object as the Telnyx API returns it.
 */
export type TeamAttributes = NonNullable<
  M_agent_gateway_teams.AgentGatewayTeamListResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link Team} for `Team.lookup`.
 */
export interface TeamLookup {
  gateway_id: string;
  id: string;
}

export type Team = Resource<
  "Telnyx.AgentGateway.Team",
  TeamProps,
  TeamAttributes,
  never,
  Providers,
  TeamLookup
>;

/**
 * A team on an Agent Gateway: a model list, a budget and rate limits that its keys share.
 *
 * Changing `gateway_id` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const Team = Resource<Team>("Telnyx.AgentGateway.Team");

export const TeamProvider = () =>
  Crud.provider(Team, {
    local: ["gateway_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["gateway_id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { instance_id: "gateway_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_agent_gateway_teams.listAgentGatewayTeams,
        { ...parent } as any,
        "none",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<TeamAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_agent_gateway_teams.createAgentGatewayTeam({
        ...Crud.omit(props, ["gateway_id"]),
        ...Crud.path(props, { instance_id: "gateway_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<TeamAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_agent_gateway_teams.updateAgentGatewayTeam({
        ...Crud.omit(delta, ["gateway_id"]),
        ...Crud.path({ ...props, ...current }, { instance_id: "gateway_id", team_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<TeamAttributes, any, any>,
    delete: (current) =>
      M_agent_gateway_teams.deleteAgentGatewayTeam({
        ...Crud.path(current, { instance_id: "gateway_id", team_id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
