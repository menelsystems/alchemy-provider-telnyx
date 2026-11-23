// Telnyx key: telnyx_agent_gateway_key in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateway_keys from "../../vendor/distilled-telnyx/src/services/agent_gateway_keys.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link Key}: the create request and the update request of the Telnyx API.
 */
export type KeyProps = Omit<
  M_agent_gateway_keys.CreateAgentGatewayKeyRequest,
  "instance_id" | "key_id"
> &
  Partial<Omit<M_agent_gateway_keys.UpdateAgentGatewayKeyRequest, "instance_id" | "key_id">> & {
    /**
     * The gateway id.
     */
    gateway_id: string;
  };

/**
 * Attributes of a deployed {@link Key}: the object as the Telnyx API returns it.
 */
export type KeyAttributes = NonNullable<
  M_agent_gateway_keys.AgentGatewayKeyListResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link Key} for `Key.lookup`.
 */
export interface KeyLookup {
  gateway_id: string;
  id: string;
}

export type Key = Resource<
  "Telnyx.AgentGateway.Key",
  KeyProps,
  KeyAttributes,
  never,
  Providers,
  KeyLookup
>;

/**
 * A virtual key that applications call an Agent Gateway with, under its own models, budget and rate limits.
 *
 * Changing `gateway_id` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const Key = Resource<Key>("Telnyx.AgentGateway.Key");

export const KeyProvider = () =>
  Crud.provider(Key, {
    local: ["gateway_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["gateway_id"] as any,
    preserve: ["key"],
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { instance_id: "gateway_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_agent_gateway_keys.listAgentGatewayKeys,
        { ...parent } as any,
        "none",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<KeyAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_agent_gateway_keys.createAgentGatewayKey({
        ...Crud.omit(props, ["gateway_id"]),
        ...Crud.path(props, { instance_id: "gateway_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<KeyAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_agent_gateway_keys.updateAgentGatewayKey({
        ...Crud.omit(delta, ["gateway_id"]),
        ...Crud.path({ ...props, ...current }, { instance_id: "gateway_id", key_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<KeyAttributes, any, any>,
    delete: (current) =>
      M_agent_gateway_keys.deleteAgentGatewayKey({
        ...Crud.path(current, { instance_id: "gateway_id", key_id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
