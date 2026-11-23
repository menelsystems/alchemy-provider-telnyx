// Telnyx mcp server: telnyx_agent_gateway_mcp_server in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateway_mcp_servers from "../../vendor/distilled-telnyx/src/services/agent_gateway_mcp_servers.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link MCPServer}: the create request and the update request of the Telnyx API.
 */
export type MCPServerProps = Omit<
  M_agent_gateway_mcp_servers.CreateAgentGatewayMcpServerRequest,
  "instance_id" | "server_id"
> &
  Partial<
    Omit<
      M_agent_gateway_mcp_servers.UpdateAgentGatewayMcpServerRequest,
      "instance_id" | "server_id"
    >
  > & {
    /**
     * The gateway id.
     */
    gateway_id: string;
  };

/**
 * Attributes of a deployed {@link MCPServer}: the object as the Telnyx API returns it.
 */
export type MCPServerAttributes = NonNullable<
  M_agent_gateway_mcp_servers.AgentGatewayMcpServerListResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link MCPServer} for `MCPServer.lookup`.
 */
export interface MCPServerLookup {
  gateway_id: string;
  id: string;
}

export type MCPServer = Resource<
  "Telnyx.AgentGateway.MCPServer",
  MCPServerProps,
  MCPServerAttributes,
  never,
  Providers,
  MCPServerLookup
>;

/**
 * An MCP server whose tools an Agent Gateway exposes to its keys.
 *
 * Changing `gateway_id` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const MCPServer = Resource<MCPServer>("Telnyx.AgentGateway.MCPServer");

export const MCPServerProvider = () =>
  Crud.provider(MCPServer, {
    local: ["gateway_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["gateway_id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { instance_id: "gateway_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_agent_gateway_mcp_servers.listAgentGatewayMcpServers,
        { ...parent } as any,
        "none",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<MCPServerAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_agent_gateway_mcp_servers.createAgentGatewayMcpServer({
        ...Crud.omit(props, ["gateway_id"]),
        ...Crud.path(props, { instance_id: "gateway_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<MCPServerAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_agent_gateway_mcp_servers.updateAgentGatewayMcpServer({
        ...Crud.omit(delta, ["gateway_id"]),
        ...Crud.path({ ...props, ...current }, { instance_id: "gateway_id", server_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<MCPServerAttributes, any, any>,
    delete: (current) =>
      M_agent_gateway_mcp_servers.deleteAgentGatewayMcpServer({
        ...Crud.path(current, { instance_id: "gateway_id", server_id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
