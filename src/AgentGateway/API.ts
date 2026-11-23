// Telnyx api: telnyx_agent_gateway_api in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_agent_gateway_apis from "../../vendor/distilled-telnyx/src/services/agent_gateway_apis.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link API}: the create request and the update request of the Telnyx API.
 */
export type APIProps = Omit<
  M_agent_gateway_apis.CreateAgentGatewayApiRequest,
  "instance_id" | "api_id"
> &
  Partial<Omit<M_agent_gateway_apis.UpdateAgentGatewayApiRequest, "instance_id" | "api_id">> & {
    /**
     * The gateway id.
     */
    gateway_id: string;
  };

/**
 * Attributes of a deployed {@link API}: the object as the Telnyx API returns it.
 */
export type APIAttributes = NonNullable<
  M_agent_gateway_apis.AgentGatewayApiListResponse["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link API} for `API.lookup`.
 */
export interface APILookup {
  gateway_id: string;
  id: string;
}

export type API = Resource<
  "Telnyx.AgentGateway.API",
  APIProps,
  APIAttributes,
  never,
  Providers,
  APILookup
>;

/**
 * An API whose OpenAPI operations an Agent Gateway exposes as tools.
 *
 * Changing `gateway_id` replaces it.
 *
 * @resource
 * @product AgentGateway
 */
export const API = Resource<API>("Telnyx.AgentGateway.API");

export const APIProvider = () =>
  Crud.provider(API, {
    local: ["gateway_id", "id"],
    stables: ["id"] as any,
    replaceOn: ["gateway_id"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, { instance_id: "gateway_id" });
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_agent_gateway_apis.listAgentGatewayApis,
        { ...parent } as any,
        "none",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<APIAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_agent_gateway_apis.createAgentGatewayApi({
        ...Crud.omit(props, ["gateway_id"]),
        ...Crud.path(props, { instance_id: "gateway_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<APIAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_agent_gateway_apis.updateAgentGatewayApi({
        ...Crud.omit(delta, ["gateway_id"]),
        ...Crud.path({ ...props, ...current }, { instance_id: "gateway_id", api_id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<APIAttributes, any, any>,
    delete: (current) =>
      M_agent_gateway_apis.deleteAgentGatewayApi({
        ...Crud.path(current, { instance_id: "gateway_id", api_id: "id" }),
      } as any).pipe(Effect.asVoid),
  });
