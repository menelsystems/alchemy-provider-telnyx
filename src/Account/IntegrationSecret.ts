// Telnyx integration secret: telnyx_integration_secret in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_integration_secrets from "#telnyx/services/integration_secrets.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link IntegrationSecret}: the create request of the Telnyx API.
 */
export type IntegrationSecretProps = Omit<
  M_integration_secrets.CreateIntegrationSecretRequest,
  "id"
>;

/**
 * Attributes of a deployed {@link IntegrationSecret}: the object as the Telnyx API returns it.
 */
export type IntegrationSecretAttributes = NonNullable<
  M_integration_secrets.IntegrationSecretsListData["data"]
>[number] & { id: string };

/**
 * Identifies an existing {@link IntegrationSecret} for `IntegrationSecret.lookup`.
 */
export interface IntegrationSecretLookup {
  id: string;
}

export type IntegrationSecret = Resource<
  "Telnyx.Account.IntegrationSecret",
  IntegrationSecretProps,
  IntegrationSecretAttributes,
  never,
  Providers,
  IntegrationSecretLookup
>;

/**
 * A secret that AI assistant tools send to your services, as a bearer token or a username and password. The API never returns the secret's value.
 *
 * Changing `identifier`, `password`, `token`, `type`, `username` replaces it.
 *
 * @resource
 * @product Account
 */
export const IntegrationSecret = Resource<IntegrationSecret>("Telnyx.Account.IntegrationSecret");

export const IntegrationSecretProvider = () =>
  Crud.provider(IntegrationSecret, {
    local: ["id"],
    stables: ["id"] as any,
    replaceOn: ["identifier", "password", "token", "type", "username"] as any,
    get: (ref) => {
      const id = Crud.key(ref, { id: "id" });
      const parent = Crud.key(ref, {});
      if (!id || !parent) return Effect.succeed(undefined);
      return Paging.all(
        M_integration_secrets.listIntegrationSecrets,
        { ...parent } as any,
        "page-flat",
      ).pipe(
        Effect.map((items) => (items as any[]).find((it) => String(it?.["id"]) === id.id)),
      ) as Effect.Effect<IntegrationSecretAttributes | undefined, any, any>;
    },
    create: (props) =>
      M_integration_secrets.createIntegrationSecret({
        ...props,
        ...Crud.path(props, {}),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<IntegrationSecretAttributes, any, any>,
    delete: (current) =>
      M_integration_secrets.deleteIntegrationSecret({
        ...Crud.path(current, { id: "id" }),
      } as any).pipe(Effect.asVoid),
    list: () =>
      Paging.all(
        M_integration_secrets.listIntegrationSecrets,
        {} as any,
        "page-flat",
      ) as Effect.Effect<any, any, any>,
  });
