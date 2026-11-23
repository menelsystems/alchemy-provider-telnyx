// Telnyx short code settings: telnyx_short_code_settings in terraform-provider-telnyx.
import { Resource } from "alchemy/Resource";
import * as Effect from "effect/Effect";
import * as M_short_codes from "#telnyx/services/short_codes.ts";
import * as Crud from "../Crud.ts";
import * as Paging from "../Paging.ts";
import type { Providers } from "../Providers.ts";

/**
 * Props for {@link ShortCodeSettings}: the create request of the Telnyx API.
 */
export type ShortCodeSettingsProps = Omit<M_short_codes.UpdateShortCodeRequest, "id"> & {
  /**
   * The short code id.
   */
  short_code_id: string;
};

/**
 * Attributes of a deployed {@link ShortCodeSettings}: the object as the Telnyx API returns it.
 */
export type ShortCodeSettingsAttributes = NonNullable<
  M_short_codes.GetShortCodeResponse["data"]
> & { short_code_id: string };

/**
 * Identifies an existing {@link ShortCodeSettings} for `ShortCodeSettings.lookup`.
 */
export interface ShortCodeSettingsLookup {
  short_code_id: string;
}

export type ShortCodeSettings = Resource<
  "Telnyx.Messaging.ShortCodeSettings",
  ShortCodeSettingsProps,
  ShortCodeSettingsAttributes,
  never,
  Providers,
  ShortCodeSettingsLookup
>;

/**
 * The messaging settings of a short code in your account. Create adopts the short code and assigns it to a messaging profile. Short codes cannot be deleted through the API, so destroy only removes the settings from Alchemy state.
 *
 * The Telnyx API cannot delete this object: destroy only removes it from Alchemy state.
 * Changing `short_code_id` replaces it.
 *
 * @resource
 * @product Messaging
 */
export const ShortCodeSettings = Resource<ShortCodeSettings>("Telnyx.Messaging.ShortCodeSettings");

export const ShortCodeSettingsProvider = () =>
  Crud.provider(ShortCodeSettings, {
    local: ["short_code_id"],
    stables: ["short_code_id"] as any,
    replaceOn: ["short_code_id"] as any,
    get: (ref) => {
      const k = Crud.key(ref, { id: "short_code_id" });
      return k
        ? (M_short_codes.getShortCode(k as any).pipe(Effect.map(Crud.data)) as Effect.Effect<
            ShortCodeSettingsAttributes,
            any,
            any
          >)
        : Effect.succeed(undefined);
    },
    create: (props) =>
      M_short_codes.updateShortCode({
        ...Crud.omit(props, ["short_code_id"]),
        ...Crud.path(props, { id: "short_code_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<ShortCodeSettingsAttributes, any, any>,
    update: ({ current, props, delta }) =>
      M_short_codes.updateShortCode({
        ...Crud.omit(delta, ["short_code_id"]),
        ...Crud.path({ ...props, ...current }, { id: "short_code_id" }),
      } as any).pipe(Effect.map(Crud.data)) as Effect.Effect<ShortCodeSettingsAttributes, any, any>,
    list: () =>
      Paging.all(M_short_codes.listShortCodes, {} as any, "page-flat") as Effect.Effect<
        any,
        any,
        any
      >,
    retain: () =>
      "The Telnyx API cannot delete short codes. The settings were removed from Alchemy state, and the short code keeps them in your Telnyx account.",
  });
