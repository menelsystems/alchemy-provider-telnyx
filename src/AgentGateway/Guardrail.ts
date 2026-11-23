// Telnyx guardrail: telnyx_agent_gateway_guardrail in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateway_guardrails from "#telnyx/services/agent_gateway_guardrails.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Guardrail}: the create request and the update request of the Telnyx API.
 */
export type GuardrailProps = Omit<
  M_agent_gateway_guardrails.CreateAgentGatewayGuardrailRequest,
  "instance_id" | "guardrail_id"
> &
  Partial<
    Omit<
      M_agent_gateway_guardrails.UpdateAgentGatewayGuardrailRequest,
      "instance_id" | "guardrail_id"
    >
  > & {
    /**
     * The gateway id.
     */
    gateway_id: string;
  };

/**
 * Attributes of a deployed {@link Guardrail}: the object as the Telnyx API returns it.
 */
export type GuardrailAttributes = NonNullable<
  M_agent_gateway_guardrails.AgentGatewayGuardrailListResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link Guardrail} for `Guardrail.lookup`.
 */
export interface GuardrailLookup {
  gateway_id: string;
  id: string;
}

export type Guardrail = Resource<
  "Telnyx.AgentGateway.Guardrail",
  GuardrailProps,
  GuardrailAttributes,
  never,
  Providers,
  GuardrailLookup
>;

/**
 * A guardrail on an Agent Gateway, a check that requests and responses pass through.
 *
 * Changing `gateway_id`, `type` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const Guardrail = Resource<Guardrail>("Telnyx.AgentGateway.Guardrail");

export const GuardrailProvider = () =>
  Crud.provider(Guardrail, {
    local: ["gateway_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["gateway_id", "type"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { instance_id: "gateway_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_agent_gateway_guardrails.listAgentGatewayGuardrails,
        { ...parent } as any,
        "none",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<GuardrailAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_agent_gateway_guardrails.createAgentGatewayGuardrail({
        ...Crud.omit(props, ["gateway_id"]),
        ...Crud.path(props, { instance_id: "gateway_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<GuardrailAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_agent_gateway_guardrails.updateAgentGatewayGuardrail({
        ...Crud.omit(delta, ["gateway_id"]),
        ...Crud.path({ ...props, ...current }, { instance_id: "gateway_id", guardrail_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<GuardrailAttributes, any, any>,
    delete: (current) =>
      M_agent_gateway_guardrails.deleteAgentGatewayGuardrail({
        ...Crud.path(current, { instance_id: "gateway_id", guardrail_id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
