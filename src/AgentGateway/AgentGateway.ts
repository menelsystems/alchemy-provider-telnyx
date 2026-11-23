// Telnyx agent gateway: telnyx_agent_gateway in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateways from "#telnyx/services/agent_gateways.ts";
import * as Crud from "../Crud.ts";
import * as Hooks from "../Hooks.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AgentGateway}: the create request of the Telnyx API.
 */
export type AgentGatewayProps = Omit<M_agent_gateways.CreateAgentGatewayRequest, "instance_id">;

/**
 * Attributes of a deployed {@link AgentGateway}: the object as the Telnyx API returns it.
 */
export type AgentGatewayAttributes = NonNullable<M_agent_gateways.AgentGatewayResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link AgentGateway} for `AgentGateway.lookup`.
 */
export interface AgentGatewayLookup {
  id: string;
}

export type AgentGateway = Resource<
  "Telnyx.AgentGateway.AgentGateway",
  AgentGatewayProps,
  AgentGatewayAttributes,
  never,
  Providers,
  AgentGatewayLookup
>;

/**
 * An Agent Gateway, an LLM and tool gateway that runs as a peer on one of the account's WireGuard Interfaces. It has no update, so every change replaces it; create waits until it is ready.
 *
 * Changing `name`, `wireguard_interface_id` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const AgentGateway = Resource<AgentGateway>("Telnyx.AgentGateway.AgentGateway");

export const AgentGatewayProvider = () =>
  Crud.provider(AgentGateway, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["name", "wireguard_interface_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { instance_id: "id" });
      return k
        ? (M_agent_gateways.getAgentGateway(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            AgentGatewayAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_agent_gateways.createAgentGateway({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<AgentGatewayAttributes, any, any>,
    delete: (current) =>
      M_agent_gateways.deleteAgentGateway({
        ...Crud.path(current, { instance_id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_agent_gateways.listAgentGateways, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    wait: (created) =>
      // A gateway starts asynchronously and its sub-objects answer 409 until it is ready.
      Hooks.waitForStatus(
        M_agent_gateways.getAgentGateway({ instance_id: created.id } as any).pipe(
          Effect.map(Crud.data),
        ),
        {
          ready: ["ready"],
          failed: ["failed", "deleting"],
          what: `agent gateway ${created.id}`,
          every: "10 seconds",
        },
      ) as Effect.Effect<AgentGatewayAttributes, any, any>,
  });
