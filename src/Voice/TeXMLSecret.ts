// Telnyx texml secret: telnyx_texml_secret in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_te_xml_rest_commands from "../../vendor/distilled-telnyx/src/services/te_xml_rest_commands.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link TeXMLSecret}: the create request of the Telnyx API.
 */
export type TeXMLSecretProps = Omit<M_te_xml_rest_commands.CreateTexmlSecretRequest, never>;

/**
 * Attributes of a deployed {@link TeXMLSecret}: the object as the Telnyx API returns it.
 */
export type TeXMLSecretAttributes = NonNullable<
  M_te_xml_rest_commands.CreateTexmlSecretResponse["data"]
> & { name: string };

/**
 * Identifies an existing {@link TeXMLSecret} for `TeXMLSecret.lookup`.
 */
export interface TeXMLSecretLookup {
  name: string;
}

export type TeXMLSecret = Resource<
  "Telnyx.Voice.TeXMLSecret",
  TeXMLSecretProps,
  TeXMLSecretAttributes,
  never,
  Providers,
  TeXMLSecretLookup
>;

/**
 * A TeXML secret: a named value that TeXML Mustache templates reference as a dynamic parameter, so the value never appears in the template or in logs. The Telnyx API can create or replace a secret but cannot read or delete it: Alchemy cannot detect changes made outside it, the secret cannot be imported, and destroy leaves it in your account.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `name`, `value_wo_version` replaces it.
 *
 * @resource
 * @product Voice
 */
export const TeXMLSecret = Resource<TeXMLSecret>("Telnyx.Voice.TeXMLSecret");

export const TeXMLSecretProvider = () =>
  Crud.provider(TeXMLSecret, {
    stables: ["name"] as any,
    replaceOn: ["name", "value_wo_version"] as any,
    get: () => Effect.succeed(undefined),
    create: (props) =>
      M_te_xml_rest_commands.createTexmlSecret({ ...props, ...Crud.path(props, {}) } as any).pipe(
        Effect.map(Crud.data),
      ) as Effect.Effect<TeXMLSecretAttributes, any, any>,
    retain: () =>
      "The Telnyx API cannot delete a TeXMLSecret; it was removed from Alchemy state but still exists in your account.",
  });
