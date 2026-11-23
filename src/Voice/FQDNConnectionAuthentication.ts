// Telnyx fqdn connection authentication: telnyx_fqdn_connection_authentication in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_fqdn_connections from "../../vendor/distilled-telnyx/src/services/fqdn_connections.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link FQDNConnectionAuthentication}: the create request of the Telnyx API.
 */
export type FQDNConnectionAuthenticationProps = Omit<
  M_fqdn_connections.UpdateFqdnAuthenticationRequest,
  "fqdn_connection_id"
> & {
  /**
   * The fqdn connection id.
   */
  fqdn_connection_id: string;
};

/**
 * Attributes of a deployed {@link FQDNConnectionAuthentication}: the object as the Telnyx API returns it.
 */
export type FQDNConnectionAuthenticationAttributes = NonNullable<
  M_fqdn_connections.GetFqdnAuthenticationResponse["data"]
> & { fqdn_connection_id: string };

/**
 * Identifies an existing {@link FQDNConnectionAuthentication} for `FQDNConnectionAuthentication.lookup`.
 */
export interface FQDNConnectionAuthenticationLookup {
  fqdn_connection_id: string;
}

export type FQDNConnectionAuthentication = Resource<
  "Telnyx.Voice.FQDNConnectionAuthentication",
  FQDNConnectionAuthenticationProps,
  FQDNConnectionAuthenticationAttributes,
  never,
  Providers,
  FQDNConnectionAuthenticationLookup
>;

/**
 * The authentication settings of an FQDN connection. Destroy removes them from Alchemy state only.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `fqdn_connection_id` replaces it.
 *
 * @resource
 * @product Voice
 */
export const FQDNConnectionAuthentication = Resource<FQDNConnectionAuthentication>(
  "Telnyx.Voice.FQDNConnectionAuthentication",
);

export const FQDNConnectionAuthenticationProvider = () =>
  Crud.provider(FQDNConnectionAuthentication, {
    local: ["fqdn_connection_id"],
    stables: ["fqdn_connection_id"] as any,
    replaceOn: ["fqdn_connection_id"] as any,
    preserve: ["password"],
    get: (ref) => {
      const k = Crud.key(ref, { fqdn_connection_id: "fqdn_connection_id" });
      return k
        ? (M_fqdn_connections.getFqdnAuthentication(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<FQDNConnectionAuthenticationAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_fqdn_connections.updateFqdnAuthentication({
        ...Crud.omit(props, ["fqdn_connection_id"]),
        ...Crud.path(props, { fqdn_connection_id: "fqdn_connection_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        FQDNConnectionAuthenticationAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_fqdn_connections.updateFqdnAuthentication({
        ...Crud.omit(delta, ["fqdn_connection_id"]),
        ...Crud.path({ ...props, ...current }, { fqdn_connection_id: "fqdn_connection_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        FQDNConnectionAuthenticationAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a FQDNConnectionAuthentication; it was removed from Alchemy state but still exists in your account.",
  });
