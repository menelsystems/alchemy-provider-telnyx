// Telnyx oauth client: telnyx_oauth_client in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_oauth_clients from "../../vendor/distilled-telnyx/src/services/oauth_clients.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link OAuthClient}: the create request and the update request of the Telnyx API.
 */
export type OAuthClientProps = Omit<M_oauth_clients.CreateOAuthClientRequest, "id"> &
  Partial<Omit<M_oauth_clients.UpdateOAuthClientRequest, "id">>;

/**
 * Attributes of a deployed {@link OAuthClient}: the object as the Telnyx API returns it.
 */
export type OAuthClientAttributes = NonNullable<M_oauth_clients.GetOAuthClientResponse["data"]> & {
  client_id: string;
};

/**
 * Identifies an existing {@link OAuthClient} for `OAuthClient.lookup`.
 */
export interface OAuthClientLookup {
  client_id: string;
}

export type OAuthClient = Resource<
  "Telnyx.Account.OAuthClient",
  OAuthClientProps,
  OAuthClientAttributes,
  never,
  Providers,
  OAuthClientLookup
>;

/**
 * An OAuth 2.0 client that apps use to get access to the Telnyx API on behalf of users. A confidential client's secret is returned only when it is created and kept in state.
 *
 * Changing `client_type` replaces it.
 *
 * @resource
 * @product Account
 */
export const OAuthClient = Resource<OAuthClient>("Telnyx.Account.OAuthClient");

export const OAuthClientProvider = () =>
  Crud.provider(OAuthClient, {
    local: ["client_id"],
    stables: ["client_id"] as any,
    replaceOn: ["client_type"] as any,
    preserve: ["client_secret"],
    get: (ref) => {
      const k = Crud.key(ref, { id: "client_id" });
      return k
        ? (M_oauth_clients.getOAuthClient(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            OAuthClientAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_oauth_clients.createOAuthClient({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<OAuthClientAttributes, any, any>,
    update: ({ current, props }) =>
      M_oauth_clients.updateOAuthClient({
        ...props,
        ...Crud.path({ ...props, ...current }, { id: "client_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<OAuthClientAttributes, any, any>,
    delete: (current) =>
      M_oauth_clients.deleteOAuthClient({ ...Crud.path(current, { id: "client_id" }) } as any).pipe(
        Effect.asVoid,
      ),
    list: () =>
      Paging.all(M_oauth_clients.listOAuthClients, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
  });
