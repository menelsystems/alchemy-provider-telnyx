// Telnyx authentication provider: telnyx_authentication_provider in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_authentication_providers from "../../vendor/distilled-telnyx/src/services/authentication_providers.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link AuthenticationProvider}: the create request and the update request of the Telnyx API.
 */
export type AuthenticationProviderProps = Omit<
  M_authentication_providers.CreateAuthenticationProviderRequest,
  "id"
> &
  Partial<Omit<M_authentication_providers.UpdateAuthenticationProviderRequest, "id">>;

/**
 * Attributes of a deployed {@link AuthenticationProvider}: the object as the Telnyx API returns it.
 */
export type AuthenticationProviderAttributes = NonNullable<
  M_authentication_providers.GetAuthenticationProviderResponse["data"]
> & { id: string };

/**
 * Identifies an existing {@link AuthenticationProvider} for `AuthenticationProvider.lookup`.
 */
export interface AuthenticationProviderLookup {
  id: string;
}

export type AuthenticationProvider = Resource<
  "Telnyx.Account.AuthenticationProvider",
  AuthenticationProviderProps,
  AuthenticationProviderAttributes,
  never,
  Providers,
  AuthenticationProviderLookup
>;

/**
 * A SAML single sign-on identity provider for the Telnyx organization.
 *
 * @resource
 * @product Account
 */
export const AuthenticationProvider = Resource<AuthenticationProvider>(
  "Telnyx.Account.AuthenticationProvider",
);

export const AuthenticationProviderProvider = () =>
  Crud.provider(AuthenticationProvider, {
    local: ["id"],
    stables: ["id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "id" });
      return k
        ? (M_authentication_providers.getAuthenticationProvider(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<AuthenticationProviderAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_authentication_providers.createAuthenticationProvider({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        AuthenticationProviderAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_authentication_providers.updateAuthenticationProvider({
        ...delta,
        ...Crud.path({ ...props, ...current }, { id: "id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        AuthenticationProviderAttributes,
        any,
        any
      >,
    delete: (current) =>
      M_authentication_providers.deleteAuthenticationProvider({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_authentication_providers.findAuthenticationProviders,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
