// Telnyx mcp server: telnyx_ai_mcp_server in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_mcp_servers from "../../vendor/distilled-telnyx/src/services/mcp_servers.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link MCPServer}: the create request and the update request of the Telnyx API.
 */
export type MCPServerProps = Omit<
  M_mcp_servers.CreateMcpServerRequest,
  "mcp_server_id" | "idempotencyKey"
> &
  Partial<Omit<M_mcp_servers.UpdateMcpServerRequest, "mcp_server_id">>;

/**
 * Attributes of a deployed {@link MCPServer}: the object as the Telnyx API returns it.
 */
export type MCPServerAttributes = M_mcp_servers.MCPServer & { id: string };

/**
 * Identifies an existing {@link MCPServer} for `MCPServer.lookup`.
 */
export interface MCPServerLookup {
  id: string;
}

export type MCPServer = Resource<
  "Telnyx.AI.MCPServer",
  MCPServerProps,
  MCPServerAttributes,
  never,
  Providers,
  MCPServerLookup
>;

/**
 * An MCP server that AI assistants can call tools on.
 *
 * @resource
 * @product AI
 */
export const MCPServer = Resource<MCPServer>("Telnyx.AI.MCPServer");

export const MCPServerProvider = () =>
  Crud.provider(MCPServer, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { mcp_server_id: "id" });
      return k
        ? (M_mcp_servers.getMcpServer(k as any) as Effect.Effect<MCPServerAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_mcp_servers.createMcpServer({ ...props, ...Crud.path(props, {}) } as any) as Effect.Effect<
        MCPServerAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_mcp_servers.updateMcpServer({
        ...props,
        ...Crud.path({ ...props, ...current }, { mcp_server_id: "id" }),
      } as any) as Effect.Effect<MCPServerAttributes, any, any>,
    delete: (current) =>
      M_mcp_servers.deleteMcpServer({ ...Crud.path(current, { mcp_server_id: "id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_mcp_servers.listMcpServers, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
