// Telnyx policy: telnyx_agent_gateway_policy in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateway_policies from "../../vendor/distilled-telnyx/src/services/agent_gateway_policies.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Policy}: the create request and the update request of the Telnyx API.
 */
export type PolicyProps = Omit<
  M_agent_gateway_policies.CreateAgentGatewayPolicyRequest,
  "instance_id" | "name"
> &
  Partial<
    Omit<M_agent_gateway_policies.UpdateAgentGatewayPolicyRequest, "instance_id" | "name">
  > & {
    /**
     * The gateway id.
     */
    gateway_id: string;
    /**
     * A name, unique on the instance. A request names the policy in its `policies` field.
     */
    name: string;
  };

/**
 * Attributes of a deployed {@link Policy}: the object as the Telnyx API returns it.
 */
export type PolicyAttributes = NonNullable<
  M_agent_gateway_policies.AgentGatewayPolicyResponse["data"]
> & { name: string };

/**
 * Identifies an existing {@link Policy} for `Policy.lookup`.
 */
export interface PolicyLookup {
  gateway_id: string;
  name: string;
}

export type Policy = Resource<
  "Telnyx.AgentGateway.Policy",
  PolicyProps,
  PolicyAttributes,
  never,
  Providers,
  PolicyLookup
>;

/**
 * A named set of guardrails on an Agent Gateway, applied to requests by policy attachments.
 *
 * Changing `gateway_id`, `name` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const Policy = Resource<Policy>("Telnyx.AgentGateway.Policy");

export const PolicyProvider = () =>
  Crud.provider(Policy, {
    local: ["gateway_id", "name"],
    stables: ["name"] as any,
    replaceOn: ["gateway_id", "name"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { instance_id: "gateway_id", name: "name" });
      return k
        ? (M_agent_gateway_policies.getAgentGatewayPolicy(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<PolicyAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_agent_gateway_policies.createAgentGatewayPolicy({
        ...Crud.omit(props, ["gateway_id"]),
        ...Crud.path(props, { instance_id: "gateway_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<PolicyAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_agent_gateway_policies.updateAgentGatewayPolicy({
        ...Crud.omit(delta, ["gateway_id"]),
        ...Crud.path({ ...props, ...current }, { instance_id: "gateway_id", name: "name" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<PolicyAttributes, any, any>,
    delete: (current) =>
      M_agent_gateway_policies.deleteAgentGatewayPolicy({
        ...Crud.path(current, { instance_id: "gateway_id", name: "name" }),
      } as any).pipe(Effect.asVoid),
  });
