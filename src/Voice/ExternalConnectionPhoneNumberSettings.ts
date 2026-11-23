// Telnyx external connection phone number settings: telnyx_external_connection_phone_number_settings in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_external_connections from "../../vendor/distilled-telnyx/src/services/external_connections.ts";
import * as Crud from "../Crud.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link ExternalConnectionPhoneNumberSettings}: the create request of the Telnyx API.
 */
export type ExternalConnectionPhoneNumberSettingsProps = Omit<
  M_external_connections.UpdateExternalConnectionPhoneNumberRequest,
  "id" | "phone_number_id"
> & {
  /**
   * The external connection id.
   */
  external_connection_id: string;
  /**
   * The phone number id.
   */
  phone_number_id: string;
};

/**
 * Attributes of a deployed {@link ExternalConnectionPhoneNumberSettings}: the object as the Telnyx API returns it.
 */
export type ExternalConnectionPhoneNumberSettingsAttributes = NonNullable<
  M_external_connections.GetExternalConnectionPhoneNumberResponse["data"]
> & { phone_number_id: string };

/**
 * Identifies an existing {@link ExternalConnectionPhoneNumberSettings} for `ExternalConnectionPhoneNumberSettings.lookup`.
 */
export interface ExternalConnectionPhoneNumberSettingsLookup {
  external_connection_id: string;
  phone_number_id: string;
}

export type ExternalConnectionPhoneNumberSettings = Resource<
  "Telnyx.Voice.ExternalConnectionPhoneNumberSettings",
  ExternalConnectionPhoneNumberSettingsProps,
  ExternalConnectionPhoneNumberSettingsAttributes,
  never,
  Providers,
  ExternalConnectionPhoneNumberSettingsLookup
>;

/**
 * The settings of a phone number on an external connection. Destroy removes them from Alchemy state only.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `external_connection_id`, `phone_number_id` replaces it.
 *
 * @resource
 * @product Voice
 */
export const ExternalConnectionPhoneNumberSettings =
  Resource<ExternalConnectionPhoneNumberSettings>(
    "Telnyx.Voice.ExternalConnectionPhoneNumberSettings",
  );

export const ExternalConnectionPhoneNumberSettingsProvider = () =>
  Crud.provider(ExternalConnectionPhoneNumberSettings, {
    local: ["external_connection_id", "phone_number_id"],
    stables: ["phone_number_id"] as any,
    replaceOn: ["external_connection_id", "phone_number_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "external_connection_id", phone_number_id: "phone_number_id" });
      return k
        ? (M_external_connections.getExternalConnectionPhoneNumber(k as any).pipe(
            Effect.map(Crud.data),
          ) as Effect.Effect<ExternalConnectionPhoneNumberSettingsAttributes, any, any>)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_external_connections.updateExternalConnectionPhoneNumber({
        ...Crud.omit(props, ["external_connection_id", "phone_number_id"]),
        ...Crud.path(props, { id: "external_connection_id", phone_number_id: "phone_number_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        ExternalConnectionPhoneNumberSettingsAttributes,
        any,
        any
      >,
    update: ({ current, props, delta }) =>
      M_external_connections.updateExternalConnectionPhoneNumber({
        ...Crud.omit(delta, ["external_connection_id", "phone_number_id"]),
        ...Crud.path(
          { ...props, ...current },
          { id: "external_connection_id", phone_number_id: "phone_number_id" },
        ),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
        ExternalConnectionPhoneNumberSettingsAttributes,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete a ExternalConnectionPhoneNumberSettings; it was removed from Alchemy state but still exists in your account.",
  });
