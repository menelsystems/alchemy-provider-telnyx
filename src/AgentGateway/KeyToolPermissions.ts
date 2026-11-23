// Telnyx key tool permissions: telnyx_agent_gateway_key_tool_permissions in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateway_tool_permissions from "#telnyx/services/agent_gateway_tool_permissions.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link KeyToolPermissions}: the create request of the Telnyx API.
 */
export type KeyToolPermissionsProps = Omit<
  M_agent_gateway_tool_permissions.SetAgentGatewayKeyToolPermissionsRequest,
  "instance_id" | "key_id"
> & {
  /**
   * The gateway id.
   */
  gateway_id: string;
  /**
   * The key id.
   */
  key_id: string;
};

/**
 * Attributes of a deployed {@link KeyToolPermissions}: the object as the Telnyx API returns it.
 */
export type KeyToolPermissionsAttributes = NonNullable<
  M_agent_gateway_tool_permissions.AgentGatewayToolPermissionsResponse["data"]
> & { key_id: string };

/**
 * Identifies an existing {@link KeyToolPermissions} for `KeyToolPermissions.lookup`.
 */
export interface KeyToolPermissionsLookup {
  gateway_id: string;
  key_id: string;
}

export type KeyToolPermissions = Resource<
  "Telnyx.AgentGateway.KeyToolPermissions",
  KeyToolPermissionsProps,
  KeyToolPermissionsAttributes,
  never,
  Providers,
  KeyToolPermissionsLookup
>;

/**
 * The MCP servers and APIs, and their tools, that an Agent Gateway key may call. Each apply replaces the whole grant; destroy grants none.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `gateway_id`, `key_id` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const KeyToolPermissions = Resource<KeyToolPermissions>(
  "Telnyx.AgentGateway.KeyToolPermissions",
);

export const KeyToolPermissionsProvider = () =>
  Crud.provider(KeyToolPermissions, {
    local: ["gateway_id", "key_id"],
    stables: ["key_id"] as any,
    replaceOn: ["gateway_id", "key_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { instance_id: "gateway_id", key_id: "key_id" });
      return k
        ? (M_agent_gateway_tool_permissions.getAgentGatewayKeyToolPermissions(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<KeyToolPermissionsAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_agent_gateway_tool_permissions.setAgentGatewayKeyToolPermissions({
        ...Crud.omit(props, ["gateway_id", "key_id"]),
        ...Crud.path(props, { instance_id: "gateway_id", key_id: "key_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        KeyToolPermissionsAttributes,
        any,
        any
      >,
    update: ({ current, props }) =>
      M_agent_gateway_tool_permissions.setAgentGatewayKeyToolPermissions({
        ...Crud.omit(props, ["gateway_id", "key_id"]),
        ...Crud.path({ ...props, ...current }, { instance_id: "gateway_id", key_id: "key_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        KeyToolPermissionsAttributes,
        any,
        any
      >,
    delete: (current) =>
      // A grant the API only replaces: destroy grants none.
      M_agent_gateway_tool_permissions.setAgentGatewayKeyToolPermissions({
        servers: [],
        ...Crud.path(current, { instance_id: "gateway_id", key_id: "key_id" }),
      } as any).pipe(Effect.asVoid),
  });
