// Telnyx gateway token key: telnyx_ai_gateway_token_key in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_ai_gateway from "../../vendor/distilled-telnyx/src/services/ai_gateway.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link GatewayTokenKey}: the create request and the update request of the Telnyx API.
 */
export type GatewayTokenKeyProps = Omit<
  M_ai_gateway.CreateTokenKeysRequest,
  "id" | "idempotencyKey"
> &
  Partial<Omit<M_ai_gateway.PatchTokenKeysRequest, "id" | "idempotencyKey" | "ifMatch">>;

/**
 * Attributes of a deployed {@link GatewayTokenKey}: the object as the Telnyx API returns it.
 */
export type GatewayTokenKeyAttributes = NonNullable<M_ai_gateway.TokenKeyResponse["data"]> & {
  id: string;
};

/**
 * Identifies an existing {@link GatewayTokenKey} for `GatewayTokenKey.lookup`.
 */
export interface GatewayTokenKeyLookup {
  id: string;
}

export type GatewayTokenKey = Resource<
  "Telnyx.AI.GatewayTokenKey",
  GatewayTokenKeyProps,
  GatewayTokenKeyAttributes,
  never,
  Providers,
  GatewayTokenKeyLookup
>;

/**
 * A token key of the AI gateway, which applications call LLMs with under the limits of its token group.
 *
 * Changing `token_group_id`, `token_user_id` replaces it.
 *
 * @resource
 * @product AI
 */
export const GatewayTokenKey = Resource<GatewayTokenKey>("Telnyx.AI.GatewayTokenKey");

export const GatewayTokenKeyProvider = () =>
  Crud.provider(GatewayTokenKey, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["token_group_id", "token_user_id"] as any,
    preserve: ["token"],
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_ai_gateway.getTokenKeys(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            GatewayTokenKeyAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_ai_gateway.createTokenKeys({
        idempotencyKey: crypto.randomUUID(),
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<GatewayTokenKeyAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_ai_gateway.patchTokenKeys({
        idempotencyKey: crypto.randomUUID(),
        // Optimistic concurrency: the change applies only to the version we observed.
        ifMatch: `"${(current as { version?: number }).version}"`,
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<GatewayTokenKeyAttributes, any, any>,
    delete: (current) =>
      M_ai_gateway.deleteTokenKeys({
        idempotencyKey: crypto.randomUUID(),
        // Optimistic concurrency: the change applies only to the version we observed.
        ifMatch: `"${(current as { version?: number }).version}"`,
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(M_ai_gateway.listTokenKeys, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
