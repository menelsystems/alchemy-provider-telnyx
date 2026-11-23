// Telnyx gateway token group: telnyx_ai_gateway_token_group in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ai_gateway from "../../vendor/distilled-telnyx/src/services/ai_gateway.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link GatewayTokenGroup}: the create request and the update request of the Telnyx API.
 */
export type GatewayTokenGroupProps = Omit<
  M_ai_gateway.CreateTokenGroupsRequest,
  "id" | "idempotencyKey"
> &
  Partial<Omit<M_ai_gateway.PatchTokenGroupsRequest, "id" | "idempotencyKey" | "ifMatch">>;

/**
 * Attributes of a deployed {@link GatewayTokenGroup}: the object as the Telnyx API returns it.
 */
export type GatewayTokenGroupAttributes = NonNullable<M_ai_gateway.TokenGroupResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link GatewayTokenGroup} for `GatewayTokenGroup.lookup`.
 */
export interface GatewayTokenGroupLookup {
  id: string;
}

export type GatewayTokenGroup = Resource<
  "Telnyx.AI.GatewayTokenGroup",
  GatewayTokenGroupProps,
  GatewayTokenGroupAttributes,
  never,
  Providers,
  GatewayTokenGroupLookup
>;

/**
 * A token group of the AI gateway, the budgets, rate limits, models and guardrails its token keys share.
 *
 * @resource
 * @product AI
 */
export const GatewayTokenGroup = Resource<GatewayTokenGroup>("Telnyx.AI.GatewayTokenGroup");

export const GatewayTokenGroupProvider = () =>
  Crud.provider(GatewayTokenGroup, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_ai_gateway.getTokenGroups(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            GatewayTokenGroupAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ai_gateway.createTokenGroups({
        idempotencyKey: crypto.randomUUID(),
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<GatewayTokenGroupAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_ai_gateway.patchTokenGroups({
        idempotencyKey: crypto.randomUUID(),
        // Optimistic concurrency: the change applies only to the version we observed.
        ifMatch: `"${(current as { version?: number }).version}"`,
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<GatewayTokenGroupAttributes, any, any>,
    delete: (current) =>
      M_ai_gateway.deleteTokenGroups({
        idempotencyKey: crypto.randomUUID(),
        // Optimistic concurrency: the change applies only to the version we observed.
        ifMatch: `"${(current as { version?: number }).version}"`,
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_ai_gateway.listTokenGroups, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
